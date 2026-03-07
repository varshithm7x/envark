'use client';

import { useEffect, useRef, useState } from 'react';

const tuiCommands = [
  { cmd: '/scan', short: 's', desc: 'Scan project for environment variables' },
  { cmd: '/risk', short: 'r', desc: 'Analyze environment variable risks' },
  { cmd: '/missing', short: 'm', desc: 'Find undefined but used variables' },
  { cmd: '/duplicates', short: 'd', desc: 'Find duplicate definitions' },
  { cmd: '/validate', short: 'v', desc: 'Validate a .env file' },
  { cmd: '/generate', short: 'g', desc: 'Generate .env.example template' },
  { cmd: '/graph', short: 'gr', desc: 'Show variable dependency graph' },
  { cmd: '/ask', short: 'a', desc: 'Ask AI about your env variables' },
  { cmd: '/analyze', short: 'an', desc: 'AI security analysis of your project' },
];

const scanLines = [
  { line: '// Pure static analysis nothing leaves your machine', color: '#71797E' },
  { line: '', color: '' },
  { line: '$ npx envark scan', color: '#00FF66' },
  { line: '', color: '' },
  { line: '\u2713 Scanned 342 files in 1.4s (cached)', color: '#A8A9AD' },
  { line: '', color: '' },
  { line: '  CRITICAL  DATABASE_URL      used, never defined', color: '#FF3B30' },
  { line: '  CRITICAL  JWT_SECRET        used, never defined', color: '#FF3B30' },
  { line: '  HIGH      STRIPE_SECRET_KEY  secret in committed file', color: '#FF9500' },
  { line: '  MEDIUM    REDIS_URL         no default, 4 usages', color: '#FFCC00' },
  { line: '  LOW       OLD_API_KEY       defined but never used', color: '#A8A9AD' },
  { line: '', color: '' },
  { line: '  Summary: 24 vars | 3 missing | 2 critical', color: '#71797E' },
];

export default function HowItWorks() {
  const [activeCmd, setActiveCmd] = useState<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const mockRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.15 }
    );

    if (codeRef?.current) observer?.observe(codeRef?.current);
    if (mockRef?.current) observer?.observe(mockRef?.current);

    return () => observer?.disconnect();
  }, []);

  return (
    <section className="section-black" style={{ borderBottom: '1px solid #2A2A2A' }}>
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        {/* Header */}
        <div className="mb-16">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
            // HOW_IT_WORKS Features & TUI
          </span>
          <h2
            className="font-mono font-800 mt-4 leading-none tracking-tightest"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#FAFAFA' }}
          >
            RUN ONCE.<br />
            <span style={{ color: '#00FF66' }}>SEE EVERYTHING.</span>
          </h2>
          <p className="font-mono mt-4 text-sm" style={{ color: '#71797E', maxWidth: '520px' }}>
            Envark recursively walks your project, extracts every env var usage with language-specific
            parsers, links definitions to usages, and scores risk all in under 2 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ border: '1px solid #2A2A2A' }}>
          {/* Scan output terminal */}
          <div
            ref={codeRef}
            className="reveal-hidden code-block"
            style={{ borderRight: '1px solid #2A2A2A' }}
          >
            <div
              className="px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-between"
              style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E' }}
            >
              <span>terminal envark scan output</span>
              <span style={{ color: '#00FF66' }}>● LIVE</span>
            </div>
            <div className="px-6 py-8">
              <pre className="font-mono text-sm leading-8 overflow-x-auto">
                {scanLines.map((l, i) => (
                  <div key={i}>
                    <span style={{ color: l.color || 'transparent' }}>{l.line || '\u00A0'}</span>
                  </div>
                ))}
              </pre>
            </div>

            {/* Steps */}
            <div style={{ borderTop: '1px solid #2A2A2A' }}>
              {[
                { n: '01', label: 'Scan', desc: 'Recursively walks your project. Respects .gitignore, skips node_modules.' },
                { n: '02', label: 'Parse', desc: 'Extracts env var usages using language-specific patterns across 8 languages.' },
                { n: '03', label: 'Resolve', desc: 'Links .env definitions to code usages and .env.example documentation.' },
                { n: '04', label: 'Score', desc: 'Assigns Critical → Info risk levels. Results cached to .envark/cache.json.' },
              ].map((step, i) => (
                <div
                  key={i}
                  className="px-6 py-5 flex items-start gap-4"
                  style={{ borderBottom: i < 3 ? '1px solid #2A2A2A' : 'none' }}
                >
                  <span className="font-mono font-800 text-xs" style={{ color: '#00FF66', minWidth: '24px' }}>
                    {step.n}
                  </span>
                  <div>
                    <div className="font-mono font-700 text-sm" style={{ color: '#FAFAFA' }}>{step.label}</div>
                    <div className="font-mono text-xs mt-1" style={{ color: '#71797E' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TUI command menu mock */}
          <div
            ref={mockRef}
            className="reveal-hidden"
            style={{ backgroundColor: '#0D0D0D', transitionDelay: '120ms' }}
          >
            <div
              className="px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-between"
              style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E' }}
            >
              <span>envark interactive TUI</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#FF5F57' }}></span>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#FEBC2E' }}></span>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#28C840' }}></span>
              </div>
            </div>

            <div className="p-6">
              {/* Mock prompt */}
              <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid #2A2A2A' }}>
                <span className="font-mono text-sm" style={{ color: '#00FF66' }}>envark&gt;</span>
                <span className="font-mono text-sm" style={{ color: '#FAFAFA' }}>/</span>
                <span className="font-mono text-sm cursor-blink" style={{ color: '#71797E' }}>▋</span>
              </div>

              {/* Command dropdown */}
              <div className="font-mono text-xs mb-3" style={{ color: '#71797E' }}>
                Type <span style={{ color: '#00FF66' }}>/</span> to open command menu:
              </div>
              <div style={{ border: '1px solid #2A2A2A' }}>
                {tuiCommands.map((cmd, i) => (
                  <button
                    key={cmd.cmd}
                    type="button"
                    className="w-full text-left px-4 py-3 flex items-center gap-4 cursor-pointer transition-all duration-100"
                    style={{
                      borderBottom: i < tuiCommands.length - 1 ? '1px solid #1A1A1A' : 'none',
                      backgroundColor: activeCmd === cmd.cmd ? '#1A2A1A' : 'transparent',
                    }}
                    onMouseEnter={() => setActiveCmd(cmd.cmd)}
                    onMouseLeave={() => setActiveCmd(null)}
                  >
                    <span
                      className="font-mono text-sm font-700"
                      style={{ color: activeCmd === cmd.cmd ? '#00FF66' : '#FAFAFA', minWidth: '100px' }}
                    >
                      {cmd.cmd}
                    </span>
                    <span className="font-mono text-xs" style={{ color: '#2A2A2A', minWidth: '20px' }}>
                      {cmd.short}
                    </span>
                    <span className="font-mono text-xs" style={{ color: '#71797E' }}>
                      {cmd.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 font-mono text-xs" style={{ color: '#2A2A2A' }}>
                ↓↑ navigate &nbsp;|&nbsp; Tab autocomplete &nbsp;|&nbsp; Enter execute &nbsp;|&nbsp; Ctrl+C exit
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}