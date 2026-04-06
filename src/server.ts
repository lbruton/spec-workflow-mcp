import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { registerTools, handleToolCall } from './tools/index.js';
import { registerPrompts, handlePromptList, handlePromptGet } from './prompts/index.js';
import { validateProjectPath, PathUtils } from './core/path-utils.js';
import { WorkspaceInitializer } from './core/workspace-initializer.js';
import { loadOrCreateConfig } from './core/config-loader.js';
import { needsMigration, migrateToDocVault } from './core/migration.js';
import { ProjectRegistry } from './core/project-registry.js';
import { DashboardSessionManager } from './core/dashboard-session.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export class SpecWorkflowMCPServer {
  private server: Server;
  private projectPath!: string;   // workflowRootPath for .specflow operations
  private workspacePath!: string; // workspace/worktree path for identity in registry
  private projectRegistry: ProjectRegistry;
  private lang?: string;

  constructor() {
    // Get version from package.json
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Get all registered tools and prompts
    const tools = registerTools();
    const prompts = registerPrompts();

    // Create tools capability object with each tool name
    const toolsCapability = tools.reduce((acc, tool) => {
      acc[tool.name] = {};
      return acc;
    }, {} as Record<string, {}>);

    this.server = new Server({
      name: 'specflow',
      version: packageJson.version
    }, {
      capabilities: {
        tools: toolsCapability,
        prompts: {
          listChanged: true
        }
      }
    });

    this.projectRegistry = new ProjectRegistry();
  }

  async initialize(projectPath: string, workspacePath: string, lang?: string) {
    this.projectPath = projectPath;
    this.workspacePath = workspacePath;
    this.lang = lang;

    // Track whether project initialization succeeded (degraded mode if not)
    let projectInitialized = false;
    let initError: string | undefined;

    try {
      // Validate project path
      await validateProjectPath(this.projectPath);
      await validateProjectPath(this.workspacePath);

      // Load or create DocVault config
      const config = await loadOrCreateConfig(this.projectPath);
      console.error(`DocVault config loaded: ${config.specflowRoot}`);

      // Initialize PathUtils with DocVault resolution
      PathUtils.initializeDocVault(config);

      // Initialize workspace
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const packageJsonPath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const workspaceInitializer = new WorkspaceInitializer(this.projectPath, packageJson.version, config);
      await workspaceInitializer.initializeWorkspace();

      // Check for and run migration if needed
      if (await needsMigration(this.projectPath, config)) {
        console.error('Migrating existing .specflow/ content to DocVault...');
        const migrationResult = await migrateToDocVault(this.projectPath, config);
        console.error(`Migration complete: ${migrationResult.migratedDirs.length} migrated, ${migrationResult.skippedDirs.length} skipped, ${migrationResult.errors.length} errors`);
      }

      // Register this project in the global registry
      const projectId = await this.projectRegistry.registerProject(this.workspacePath, process.pid, {
        workflowRootPath: this.projectPath
      });
      console.error(`Project registered: ${projectId}`);
      projectInitialized = true;

    } catch (error: any) {
      // Project initialization failed — enter degraded mode instead of crashing.
      // This allows the MCP server to start and report the error via tool calls,
      // rather than silently dying and leaving the client with no connection.
      initError = error.message || String(error);
      console.error(`WARNING: Project initialization failed — starting in degraded mode.`);
      console.error(`  Path: ${this.projectPath}`);
      console.error(`  Error: ${initError}`);
      console.error(`  Hint: Launch specflow with an explicit project path, e.g.:`);
      console.error(`    npx -y @lbruton/specflow@latest /path/to/your/project`);
      console.error(`  The MCP server will start, but tools will return errors until a valid project is configured.`);
    }

    // Try to get the dashboard URL from session manager
    let dashboardUrl: string | undefined = undefined;
    try {
      const sessionManager = new DashboardSessionManager();
      const dashboardSession = await sessionManager.getDashboardSession();
      if (dashboardSession) {
        dashboardUrl = dashboardSession.url;
      }
    } catch (error) {
      // Dashboard not running, continue without it
    }

    // Create context for tools — include degraded mode info
    const context: any = {
      projectPath: this.projectPath,
      dashboardUrl: dashboardUrl,
      lang: this.lang
    };

    if (!projectInitialized) {
      context.degraded = true;
      context.degradedReason = initError;
    }

    // Register handlers
    this.setupHandlers(context);

    // Connect to stdio transport
    const transport = new StdioServerTransport();

    // Handle client disconnection - exit gracefully when transport closes
    transport.onclose = async () => {
      await this.stop();
      process.exit(0);
    };

    await this.server.connect(transport);

    // Monitor stdin for client disconnection (additional safety net)
    process.stdin.on('end', async () => {
      await this.stop();
      process.exit(0);
    });

    // Handle stdin errors
    process.stdin.on('error', async (error) => {
      console.error('stdin error:', error);
      await this.stop();
      process.exit(1);
    });

    if (projectInitialized) {
      console.error('MCP server initialized successfully');
    } else {
      console.error('MCP server started in degraded mode — tools will report configuration errors');
    }
  }

  private setupHandlers(context: any) {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: registerTools()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // In degraded mode, return a clear error for every tool call
      if (context.degraded) {
        return {
          content: [{
            type: 'text' as const,
            text: `SpecFlow MCP server is running in degraded mode — no valid project found.\n\n` +
              `Error: ${context.degradedReason}\n\n` +
              `The server was launched without a valid project path. To fix this:\n` +
              `1. Ensure your MCP config passes the project directory as an argument:\n` +
              `   npx -y @lbruton/specflow@latest .\n` +
              `2. Or specify an absolute path:\n` +
              `   npx -y @lbruton/specflow@latest /path/to/your/project\n` +
              `3. Ensure the project has a .specflow/config.json file\n\n` +
              `Current path: ${context.projectPath}`
          }],
          isError: true
        };
      }

      try {
        return await handleToolCall(request.params.name, request.params.arguments || {}, context);
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        return await handlePromptList();
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      // In degraded mode, return a helpful error for prompt requests too
      if (context.degraded) {
        return {
          messages: [{
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `SpecFlow MCP server is in degraded mode — no valid project found at: ${context.projectPath}\n` +
                `Error: ${context.degradedReason}\n` +
                `Fix: Add the project path to your MCP config args, e.g.: npx -y @lbruton/specflow@latest .`
            }
          }]
        };
      }

      try {
        return await handlePromptGet(
          request.params.name,
          request.params.arguments || {},
          context
        );
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  /**
   * Check if running in Docker mode (path translation enabled)
   * When in Docker, we can't verify host PIDs and want projects to persist
   */
  private isDockerMode(): boolean {
    const hostPrefix = process.env.SPEC_WORKFLOW_HOST_PATH_PREFIX;
    const containerPrefix = process.env.SPEC_WORKFLOW_CONTAINER_PATH_PREFIX;
    return !!(hostPrefix && containerPrefix);
  }

  async stop() {
    try {
      // Only unregister when NOT in Docker mode
      // In Docker, projects should persist across sessions since we can't verify host PIDs
      if (!this.isDockerMode()) {
        try {
          // Pass current PID to only remove this specific instance
          await this.projectRegistry.unregisterProject(this.workspacePath, process.pid);
          console.error('Project instance unregistered from global registry');
        } catch (error) {
          // Ignore errors during cleanup
        }
      } else {
        console.error('Docker mode: skipping project unregistration (projects persist across sessions)');
      }

      // Stop MCP server
      await this.server.close();
    } catch (error) {
      console.error('Error during shutdown:', error);
      // Continue with shutdown even if there are errors
    }
  }
}
