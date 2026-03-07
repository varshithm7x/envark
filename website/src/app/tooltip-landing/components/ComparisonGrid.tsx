'use client';

import { useEffect, useRef } from 'react';

const mcpTools = [
  {
    tool: 'get_env_map',
    desc: 'Full environment variable map totals, defined, missing, critical counts.',
    example: '{ totalEnvVars: 24, defined: 20, missing: 3, critical: 2 }',
  },
  {
    tool: 'get_env_risk',
    desc: 'Risk assessment for every variable level, issues, and affected files.',
    example: '{ critical: 2, high: 1, medium: 5, riskReport: [...] }',
  },
  {
    tool: 'get_missing_envs',
    desc: 'Variables that will cause runtime crashes usage count and danger level.',
    example: '{ missing: [{ name: "API_SECRET", dangerLevel: "critical" }] }',
  },
  {
    tool: 'validate_env_file',
    desc: 'Validate any .env file against actual code requirements.',
    example: '{ valid: false, failed: [{ variable: "JWT_SECRET", issue: "Missing" }] }',
  },
  {
    tool: 'generate_env_template',
    desc: 'Auto-generate .env.example from your codebase with required counts.',
    example: '{ content: "DATABASE_URL=...", variableCount: 18, requiredCount: 5 }',
  },
  {
    tool: 'get_duplicates',
    desc: 'Find variables defined in multiple places with different values.',
    example: '{ duplicates: [{ name: "PORT", locations: [...] }] }',
  },
  {
    tool: 'get_env_graph',
    desc: 'Dependency graph showing which variables cluster together.',
    example: '{ nodes: [...], edges: [...], clusters: [...] }',
  },
  {
    tool: 'get_env_usage',
    desc: 'Every file and line where a specific variable is accessed.',
    example: '{ usages: [{ file: "server.ts", line: 42 }] }',
  },
];

const languageRows = [
  { lang: 'JavaScript', exts: '.js, .jsx, .mjs', pattern: 'process.env.VAR, import.meta.env.VAR' },
  { lang: 'TypeScript', exts: '.ts, .tsx, .mts', pattern: 'process.env.VAR, import.meta.env.VAR' },
  { lang: 'Python', exts: '.py', pattern: "os.environ['VAR'], os.getenv('VAR')" },
  { lang: 'Go', exts: '.go', pattern: 'os.Getenv("VAR"), os.LookupEnv("VAR")' },
  { lang: 'Rust', exts: '.rs', pattern: 'env::var("VAR"), std::env::var("VAR")' },
  { lang: 'Shell', exts: '.sh, .bash, .zsh', pattern: '$VAR, ${VAR}, ${VAR:-default}' },
  { lang: 'Docker', exts: 'Dockerfile', pattern: 'ENV VAR=value, ARG VAR' },
  { lang: 'Env Files', exts: '.env*', pattern: 'KEY=VALUE' },
];

export default function ComparisonGrid() {
  const tableRef = useRef<HTMLDivElement>(null);
  const mcpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            entry.target.classList.remove('reveal-hidden');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (tableRef.current) observer.observe(tableRef.current);
    if (mcpRef.current) observer.observe(mcpRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section-black" style={{ borderBottom: '1px solid #2A2A2A' }}>
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        {/* Header */}
        <div className="mb-16">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
            // LANGUAGES + MCP What Envark Understands
          </span>
          <h2
            className="font-mono font-800 mt-4 leading-none tracking-tightest"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#FAFAFA' }}
          >
            EVERY LANGUAGE.<br />
            <span style={{ color: '#00FF66' }}>EVERY AI ASSISTANT.</span>
          </h2>
          <p className="font-mono mt-4 text-sm" style={{ color: '#71797E', maxWidth: '520px' }}>
            Envark parses 8 languages and exposes 10+ MCP tools to Claude, Cursor, VS Code,
            and Windsurf giving AI assistants deep visibility into your env configuration.
          </p>
        </div>

        {/* Language table */}
        <div ref={tableRef} className="reveal-hidden overflow-x-auto mb-16">
          <div style={{ minWidth: '600px' }}>
            <div className="grid" style={{ gridTemplateColumns: '1.5fr 1.5fr 2fr' }}>
              {['Language', 'Extensions', 'Detected Pattern'].map((col) => (
                <div
                  key={col}
                  className="px-4 py-3 font-mono text-xs uppercase tracking-widest"
                  style={{ color: '#71797E', borderBottom: '2px solid #FAFAFA' }}
                >
                  {col}
                </div>
              ))}
            </div>
            {languageRows.map((row, ri) => (
              <div
                key={ri}
                className="grid"
                style={{
                  gridTemplateColumns: '1.5fr 1.5fr 2fr',
                  borderBottom: ri < languageRows.length - 1 ? '1px solid #2A2A2A' : 'none',
                }}
              >
                <div className="px-4 py-4 font-mono text-sm font-700" style={{ color: '#FAFAFA' }}>
                  {row.lang}
                </div>
                <div className="px-4 py-4 font-mono text-sm" style={{ color: '#A8A9AD' }}>
                  {row.exts}
                </div>
                <div className="px-4 py-4 font-mono text-xs" style={{ color: '#A8A9AD' }}>
                  {row.pattern}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MCP Tools grid */}
        <div className="mb-6">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
            // MCP_TOOLS Exposed to AI Assistants
          </span>
        </div>
        <div
          ref={mcpRef}
          className="reveal-hidden grid grid-cols-1 md:grid-cols-2 gap-0"
          style={{ border: '1px solid #2A2A2A' }}
        >
          {mcpTools.map((t, i) => (
            <div
              key={t.tool}
              className="p-6"
              style={{
                borderRight: i % 2 === 0 ? '1px solid #2A2A2A' : 'none',
                borderBottom: i < mcpTools.length - 2 ? '1px solid #2A2A2A' : 'none',
              }}
            >
              <div className="font-mono text-sm font-800 mb-2" style={{ color: '#FAFAFA' }}>
                {t.tool}
              </div>
              <div className="font-mono text-xs mb-3" style={{ color: '#71797E' }}>
                {t.desc}
              </div>
              <div className="font-mono text-xs px-3 py-2" style={{ backgroundColor: '#1A1A1A', color: '#A8A9AD' }}>
                {t.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}