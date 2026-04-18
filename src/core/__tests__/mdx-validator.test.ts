import { describe, it, expect } from 'vitest';
import { validateMarkdownForMdx, formatMdxValidationIssues } from '../mdx-validator.js';

describe('mdx-validator', () => {
  it('returns invalid when mdx pre-render (compile) fails', async () => {
    const content = `# Metrics\n\n- Threshold: <5%\n`;

    const result = await validateMarkdownForMdx(content);

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.ruleId === 'mdx-compile-error')).toBe(true);
    expect(result.issues[0].message).toContain('Unexpected character');
  });

  it('ignores less-than inside inline code and fenced code blocks', async () => {
    const content = [
      '# Safe',
      '',
      '- Inline code: `<5%`',
      '',
      '```md',
      '- Code block: <5%',
      '```',
      '',
    ].join('\n');

    const result = await validateMarkdownForMdx(content);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('formats issues with line and column', () => {
    const formatted = formatMdxValidationIssues([
      {
        line: 12,
        column: 18,
        ruleId: 'mdx-compile-error',
        message: 'Unexpected character',
        severity: 'error',
      },
    ]);

    expect(formatted).toEqual(['Line 12:18 [mdx-compile-error] Unexpected character']);
  });

  describe('Mode A pre-pass — template placeholders', () => {
    it('rejects unexpanded {N} placeholder with actionable message', async () => {
      const content = '- [ ] {N}. Establish test baseline\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].ruleId).toBe('mdx-template-placeholder');
      expect(result.issues[0].message).toContain('{N}');
      expect(result.issues[0].message).toContain('Unexpanded task placeholder');
    });

    it('rejects {N+1} through {N+8} placeholders and reports each', async () => {
      const lines = ['# Tasks', ''];
      for (let i = 0; i <= 8; i++) {
        const tok = i === 0 ? '{N}' : `{N+${i}}`;
        lines.push(`- [ ] ${tok}. Task ${tok}`);
      }
      const content = lines.join('\n');

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      // Each placeholder appears twice per line (task id + "Task X") → 18 hits.
      expect(result.issues.length).toBe(18);
      expect(result.issues.every((i) => i.ruleId === 'mdx-template-placeholder')).toBe(true);
    });

    it('ignores {N+1} inside fenced code blocks', async () => {
      const content = ['```md', '- [ ] {N+1}. Task', '```', ''].join('\n');

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(true);
    });

    it('ignores {N+1} inside inline code spans', async () => {
      const content = 'Reference the closing task `{N+1}` numbering scheme.\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(true);
    });

    it('pre-pass short-circuits the compile step', async () => {
      // Content has a template placeholder AND invalid MDX (`<1s`). Pre-pass
      // should return the actionable placeholder issue, not the useless acorn
      // error.
      const content = '- Threshold: <1s for response. Task {N+1}.\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      expect(result.issues.every((i) => i.ruleId === 'mdx-template-placeholder')).toBe(true);
    });
  });

  describe('Mode A pre-pass — bare JSX tags', () => {
    it('rejects bare <path> token outside code', async () => {
      const content = 'Specify the repo location with --folder <path> in the command.\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].ruleId).toBe('mdx-bare-jsx-tag');
      expect(result.issues[0].message).toContain('<path>');
    });

    it('rejects bare <start-of-spec> with dashed name', async () => {
      const content = 'The <start-of-spec> marker triggers processing.\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].ruleId).toBe('mdx-bare-jsx-tag');
      expect(result.issues[0].message).toContain('<start-of-spec>');
    });

    it('allows bare HTML block tags like <div> and <span>', async () => {
      const content = 'A <div> block and a <span> inline are fine for MDX.\n';

      const result = await validateMarkdownForMdx(content);

      // These are valid JSX/HTML block elements — MDX handles them. Pre-pass
      // must not flag them. (Compile step may still fail on unclosed tags, but
      // that is a separate, accurate error.)
      expect(result.issues.every((i) => i.ruleId !== 'mdx-bare-jsx-tag')).toBe(true);
    });

    it('ignores <ref> inside fenced code', async () => {
      const content = ['```md', 'See <ref> for details.', '```', ''].join('\n');

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(true);
    });
  });

  describe('Mode B content — should remain valid (was hypothesized, confirmed phantom)', () => {
    it('allows bare mcp__ tool names inside _Prompt:_ italic spans', async () => {
      const content =
        '- [ ] 1. Task\n  - _Prompt: Call mcp__specflow__log-implementation with artifacts. Do not mark [x] until mcp__specflow__log-implementation succeeds._\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(true);
    });
  });

  describe('Compile-error fallback', () => {
    it('annotates the acorn error message with actionable hint', async () => {
      // Invalid expression inside curly braces — acorn cannot parse, compile
      // throws, fallback branch fires.
      const content = '# Title\n\nA {++} broken expression.\n';

      const result = await validateMarkdownForMdx(content);

      expect(result.valid).toBe(false);
      expect(result.issues[0].ruleId).toBe('mdx-compile-error');
      // Original acorn message plus our added hint.
      expect(result.issues[0].message).toContain('acorn');
      expect(result.issues[0].message).toContain('backticks');
    });
  });
});
