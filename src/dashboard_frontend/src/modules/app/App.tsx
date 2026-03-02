import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { WebSocketProvider, useWs } from '../ws/WebSocketProvider';
import { ProjectProvider, useProjects } from '../projects/ProjectProvider';
import { ApiProvider } from '../api/api';
import { HighlightStyles } from '../theme/HighlightStyles';
import { DashboardStatistics } from '../pages/DashboardStatistics';
import { SpecsPage } from '../pages/SpecsPage';
import { SteeringPage } from '../pages/SteeringPage';
import { TasksPage } from '../pages/TasksPage';
import { LogsPage } from '../pages/LogsPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { SpecViewerPage } from '../pages/SpecViewerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { DevOpsHubPage } from '../pages/DevOpsHubPage';
import { NotificationProvider } from '../notifications/NotificationProvider';
import { VolumeControl } from '../notifications/VolumeControl';
import { useApi } from '../api/api';
import { LanguageSelector } from '../../components/LanguageSelector';
import { I18nErrorBoundary } from '../../components/I18nErrorBoundary';
import { ProjectDropdown } from '../components/ProjectDropdown';
import { PageNavigationSidebar } from '../components/PageNavigationSidebar';

const projectGithubPRs: Record<string, string> = {
  StakTrakr: 'https://github.com/lbruton/StakTrakr/pulls',
  HelloKittyFriends: 'https://github.com/lbruton/HelloKittyFriends/pulls',
};

function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useWs();
  const { currentProject } = useProjects();
  const { info } = useApi();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Update the browser tab title when project info is loaded
  useEffect(() => {
    if (info?.projectName) {
      document.title = t('documentTitle', { projectName: info.projectName });
    }
  }, [info?.projectName, t]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-panel)]/60 border-b border-[var(--border-default)]">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Page Navigation Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
              title={t('nav.toggleSidebar', 'Toggle navigation sidebar')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* GitHub Pull Requests link */}
            {currentProject && projectGithubPRs[currentProject.projectName] && (
              <a
                href={projectGithubPRs[currentProject.projectName]}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                title="Open Pull Requests on GitHub"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h.01M8 11h.01M8 15h.01M8 19h.01M16 7a2 2 0 100-4 2 2 0 000 4zm0 14a2 2 0 100-4 2 2 0 000 4zM8 7a2 2 0 100-4 2 2 0 000 4zm0 10a2 2 0 100-4 2 2 0 000 4zm8-3a2 2 0 00-2 2m0-6a2 2 0 00-2-2m-6 6a2 2 0 01-2-2m0-6a2 2 0 012-2" />
                </svg>
                Pull Requests
              </a>
            )}

            {/* Project Dropdown */}
            <ProjectDropdown />
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-error)]'}`} title={connected ? t('connectionStatus.connected') : t('connectionStatus.disconnected')} />

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-3">
              <VolumeControl />

              <LanguageSelector />

              <button onClick={toggleTheme} className="btn-secondary" title={t('theme.toggle')}>
                {theme === 'dark' ? t('theme.dark') : t('theme.light')}
              </button>
            </div>

            {/* Mobile/Tablet Settings Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
              title={t('mobile.settings', 'Settings')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Slide-out Controls Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={closeMobileMenu}
        >
          <div className="absolute inset-0 bg-black/50 transition-opacity" />

          <div
            className="absolute right-0 top-0 h-full w-64 bg-[var(--surface-panel)] shadow-[var(--shadow-overlay)] transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
                <div className="text-lg font-semibold text-[var(--text-primary)]">{t('mobile.settings', 'Settings')}</div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
                  aria-label={t('mobile.closeMenu')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Controls Section */}
              <div className="flex-1 px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{t('mobile.notificationVolume')}</span>
                  <VolumeControl />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{t('language.select')}</span>
                  <LanguageSelector className="w-32" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{t('mobile.theme')}</span>
                  <button onClick={toggleTheme} className="px-3 py-1.5 bg-[var(--surface-inset)] text-[var(--text-secondary)] rounded-md text-sm hover:bg-[var(--surface-hover)] transition-colors">
                    {theme === 'dark' ? t('theme.dark') : t('theme.light')}
                  </button>
                </div>

                {currentProject && projectGithubPRs[currentProject.projectName] && (
                  <div className="pt-2 border-t border-[var(--border-default)]">
                    <a
                      href={projectGithubPRs[currentProject.projectName]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h.01M8 11h.01M8 15h.01M8 19h.01M16 7a2 2 0 100-4 2 2 0 000 4zm0 14a2 2 0 100-4 2 2 0 000 4zM8 7a2 2 0 100-4 2 2 0 000 4zm0 10a2 2 0 100-4 2 2 0 000 4zm8-3a2 2 0 00-2 2m0-6a2 2 0 00-2-2m-6 6a2 2 0 01-2-2m0-6a2 2 0 012-2" />
                      </svg>
                      Pull Requests
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Dashboard Modal removed — using route-based page instead */}
    </>
  );
}

function IframePage({ title, src, sandbox }: { title: string; src: string; sandbox?: string }) {
  return (
    <div className="-mx-6 -my-6 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--surface-inset)]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={src}
        className="flex-1 w-full border-0"
        title={title}
        sandbox={sandbox || 'allow-scripts allow-same-origin allow-forms allow-popups'}
      />
    </div>
  );
}

function AppInner() {
  const { initial } = useWs();
  const { currentProjectId } = useProjects();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop

  const SIDEBAR_COLLAPSE_KEY = 'spec-workflow-sidebar-collapsed';
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  // Persist sidebar collapse state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(sidebarCollapsed));
    } catch (error) {
      console.error('Failed to save sidebar collapse state:', error);
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ApiProvider initial={initial} projectId={currentProjectId}>
      <NotificationProvider>
        <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] lg:flex">
          {/* Page Navigation Sidebar */}
          <PageNavigationSidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={toggleSidebarCollapse}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <Header toggleSidebar={toggleSidebar} />
            <HighlightStyles />
            <main className="w-full px-6 py-6">
            {currentProjectId ? (
              <Routes>
                <Route path="/" element={<DashboardStatistics />} />
                <Route path="/steering" element={<SteeringPage />} />
                <Route path="/specs" element={<SpecsPage />} />
                <Route path="/specs/view" element={<SpecViewerPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/devops" element={<DevOpsHubPage />} />
                <Route path="/devops/api-dashboard" element={<IframePage title="API Dashboard — Home Poller" src="https://192.168.1.81:3011" />} />
                <Route path="/devops/wiki" element={<IframePage title="StakTrakr Wiki" src="https://beta.staktrakr.com/wiki/" />} />
                <Route path="/devops/hkf-wiki" element={<IframePage title="HelloKittyFriends Wiki" src="http://127.0.0.1:9778" />} />
                <Route path="/api-dashboard" element={<Navigate to="/devops/api-dashboard" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    No Projects Available
                  </h2>
                  <p className="text-[var(--text-secondary)] mb-6">
                    Start MCP servers to see projects here.
                  </p>
                  <div className="text-sm text-[var(--text-muted)]">
                    Run: <code className="px-2 py-1 bg-[var(--surface-inset)] rounded-md">npx @pimzino/spec-workflow-mcp /path/to/project</code>
                  </div>
                </div>
              </div>
            )}
            </main>
          </div>
        </div>
      </NotificationProvider>
    </ApiProvider>
  );
}

function AppWithProviders() {
  const { currentProjectId } = useProjects();

  return (
    <WebSocketProvider projectId={currentProjectId}>
      <AppInner />
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <I18nErrorBoundary>
      <ThemeProvider>
        <ProjectProvider>
          <AppWithProviders />
        </ProjectProvider>
      </ThemeProvider>
    </I18nErrorBoundary>
  );
}


