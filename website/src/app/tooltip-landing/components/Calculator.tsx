'use client';

import { useState } from 'react';

export default function Calculator() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="hero"
      className="section-black"
      style={{ borderBottom: '1px solid #2A2A2A' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        {/* Header label */}
        <div className="mb-12">
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: '#71797E' }}
          >
            // ENV_GUARDIAN_v0.1.2 Available Now on npm
          </span>
          <h1
            className="font-mono font-800 mt-4 leading-none tracking-tightest"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#FAFAFA' }}
          >
            GUARD YOUR ENV VARS.<br />
            <span style={{ color: '#00FF66' }}>BEFORE THEY BREAK PROD.</span>
          </h1>
          <p className="font-mono mt-6 text-sm leading-relaxed" style={{ color: '#71797E', maxWidth: '560px' }}>
            Envark maps, analyzes, and guards environment variables across your entire codebase.
            MCP server + interactive TUI. Pure static analysis no data leaves your machine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ border: '1px solid #2A2A2A' }}>
          {/* Quick start panel */}
          <div style={{ borderRight: '1px solid #2A2A2A' }}>
            <div
              className="px-8 py-4 font-mono text-xs uppercase tracking-widest"
              style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E', backgroundColor: '#0A0A0A' }}
            >
              QUICK_START Zero Config
            </div>

            <div className="px-8 py-10 space-y-8">
              {/* npx command */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: '#71797E' }}>
                  01 Run Interactive TUI (No Install)
                </div>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-5 py-4 cursor-pointer group text-left"
                  style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}
                  onClick={() => handleCopy('npx envark')}
                  aria-label="Copy npx envark command"
                >
                  <span className="font-mono text-lg font-700" style={{ color: '#00FF66' }}>$ npx envark</span>
                  <span className="font-mono text-xs" style={{ color: copied ? '#00FF66' : '#71797E' }}>
                    {copied ? '✓ copied' : 'click to copy'}
                  </span>
                </button>
                <span className="font-mono text-xs mt-2 block" style={{ color: '#2A2A2A' }}>
                  or: bunx envark
                </span>
              </div>

              {/* global install */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: '#71797E' }}>
                  02 Global Install
                </div>
                <div className="px-5 py-4" style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}>
                  <span className="font-mono text-sm font-600" style={{ color: '#A8A9AD' }}>$ npm install -g envark</span>
                </div>
              </div>

              {/* MCP */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: '#71797E' }}>
                  03 MCP Server (VS Code / Claude / Cursor)
                </div>
                <div className="px-5 py-4" style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}>
                  <span className="font-mono text-sm font-600" style={{ color: '#A8A9AD' }}>$ envark init vscode</span>
                </div>
                <span className="font-mono text-xs mt-2 block" style={{ color: '#2A2A2A' }}>
                  also: envark init claude &nbsp;|&nbsp; envark init cursor &nbsp;|&nbsp; envark init windsurf
                </span>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <a
                  href="#install"
                  className="cta-green font-mono text-sm uppercase tracking-widest px-6 py-4 inline-block w-full text-center"
                >
                  See All Install Options →
                </a>
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div style={{ backgroundColor: '#0D0D0D' }}>
            <div
              className="px-8 py-4 font-mono text-xs uppercase tracking-widest"
              style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E' }}
            >
              WHY_ENVARK By The Numbers
            </div>
            <div className="grid grid-cols-2 gap-0">
              {[
                { stat: '8', label: 'Languages\nSupported', green: true },
                { stat: '10+', label: 'MCP Tools\nfor AI Assistants', green: false },
                { stat: '<2s', label: 'Full Scan\n500-File Project', green: true },
                { stat: '5', label: 'Risk Levels\nCritical→Info', green: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 flex flex-col justify-between"
                  style={{
                    borderRight: i % 2 === 0 ? '1px solid #2A2A2A' : 'none',
                    borderBottom: i < 2 ? '1px solid #2A2A2A' : 'none',
                    minHeight: '140px',
                  }}
                >
                  <div
                    className="font-mono font-800 leading-none"
                    style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: item.green ? '#00FF66' : '#FAFAFA' }}
                  >
                    {item.stat}
                  </div>
                  <div className="font-mono text-xs mt-2 whitespace-pre-line" style={{ color: '#71797E' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supported languages strip */}
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid #2A2A2A' }}>
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
            Analyzes:&nbsp;
          </span>
          <div className="flex flex-wrap gap-3 mt-3">
            {['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Shell', 'Docker', '.env files'].map((lang) => (
              <span
                key={lang}
                className="font-mono text-xs px-3 py-1.5"
                style={{ border: '1px solid #2A2A2A', color: '#A8A9AD' }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
