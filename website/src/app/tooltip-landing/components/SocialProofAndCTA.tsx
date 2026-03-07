'use client';

import { useEffect, useRef } from 'react';

const aiCommands = [
  { cmd: '/ask', short: 'a', desc: 'Ask AI about environment variables' },
  { cmd: '/analyze', short: 'an', desc: 'AI security analysis of your project' },
  { cmd: '/suggest', short: 'su', desc: 'Get AI suggestions for a variable' },
  { cmd: '/explain', short: 'ex', desc: 'AI explains a variable\'s purpose' },
  { cmd: '/template', short: 'tpl', desc: 'AI generates .env for your project type' },
];



export default function SocialProofAndCTA() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

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

    cardsRef.current.forEach((c) => { if (c) observer.observe(c); });
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* AI Assistant section */}
      <section className="section-black" style={{ borderBottom: '1px solid #2A2A2A' }}>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-16">
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
              // AI_ASSISTANT OpenAI, Anthropic, Ollama, Gemini
            </span>
            <h2
              className="font-mono font-800 mt-4 leading-none tracking-tightest"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#FAFAFA' }}
            >
              YOUR AI KNOWS<br />
              <span style={{ color: '#00FF66' }}>YOUR ENV VARS.</span>
            </h2>
            <p className="font-mono mt-4 text-sm" style={{ color: '#71797E', maxWidth: '520px' }}>
              Envark\'s AI assistant can analyze, explain, and generate environment configurations.
              Connect OpenAI, Anthropic Claude, Google Gemini, or run locally with Ollama.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ border: '1px solid #2A2A2A' }}>
            {/* AI commands */}
            <div style={{ borderRight: '1px solid #2A2A2A' }}>
              <div
                className="px-6 py-3 font-mono text-xs uppercase tracking-widest"
                style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E', backgroundColor: '#0A0A0A' }}
              >
                AI_COMMANDS
              </div>
              {aiCommands.map((cmd, i) => (
                <div
                  key={cmd.cmd}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className="reveal-hidden px-6 py-5 flex items-start gap-4"
                  style={{
                    borderBottom: i < aiCommands.length - 1 ? '1px solid #2A2A2A' : 'none',
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <span className="font-mono font-700 text-sm" style={{ color: '#00FF66', minWidth: '90px' }}>
                    {cmd.cmd}
                  </span>
                  <span className="font-mono text-xs" style={{ color: '#2A2A2A', minWidth: '24px' }}>{cmd.short}</span>
                  <span className="font-mono text-xs" style={{ color: '#71797E' }}>{cmd.desc}</span>
                </div>
              ))}
            </div>

            {/* AI config */}
            <div style={{ backgroundColor: '#0D0D0D' }}>
              <div
                className="px-6 py-3 font-mono text-xs uppercase tracking-widest"
                style={{ borderBottom: '1px solid #2A2A2A', color: '#71797E' }}
              >
                AI_CONFIG In The TUI
              </div>
              <div className="px-6 py-8 space-y-4">
                {[
                  { label: '# OpenAI (recommended)', cmd: '/config openai sk-your-api-key gpt-4o', color: '#A8A9AD' },
                  { label: '# Anthropic Claude', cmd: '/config anthropic sk-ant-... claude-sonnet-4-20250514', color: '#A8A9AD' },
                  { label: '# Google Gemini', cmd: '/config gemini your-api-key gemini-1.5-pro', color: '#A8A9AD' },
                  { label: '# Ollama (local, free)', cmd: '/config ollama llama3.2', color: '#00FF66' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="font-mono text-xs" style={{ color: '#2A2A2A' }}>{item.label}</div>
                    <div className="font-mono text-sm mt-1" style={{ color: item.color }}>{item.cmd}</div>
                  </div>
                ))}
                <div className="pt-4" style={{ borderTop: '1px solid #2A2A2A' }}>
                  <div className="font-mono text-xs mb-3" style={{ color: '#71797E' }}>Or set environment variables:</div>
                  {[
                    'export OPENAI_API_KEY="sk-..."',
                    'export ANTHROPIC_API_KEY="sk-ant-..."',
                    'export OLLAMA_MODEL="llama3.2"',
                  ].map((v, i) => (
                    <div key={i} className="font-mono text-xs" style={{ color: '#71797E' }}>{v}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install + MCP CTA */}
      <section id="install" className="section-black" style={{ borderBottom: '1px solid #2A2A2A' }}>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div
            ref={ctaRef}
            className="reveal-hidden grid grid-cols-1 lg:grid-cols-2 gap-0"
            style={{ border: '1px solid #2A2A2A' }}
          >
            {/* Left: CTA copy */}
            <div
              className="p-10 md:p-16 flex flex-col justify-between"
              style={{ borderRight: '1px solid #2A2A2A' }}
            >
              <div>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
                  // GET_STARTED Zero Friction
                </span>
                <h2
                  className="font-mono font-800 mt-6 leading-none tracking-tightest"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#FAFAFA' }}
                >
                  CATCH THE BUG<br />
                  BEFORE IT<br />
                  <span style={{ color: '#00FF66' }}>SHIPS.</span>
                </h2>
                <p className="font-mono mt-6 text-sm leading-relaxed" style={{ color: '#71797E', maxWidth: '400px' }}>
                  One command. Zero configuration. Envark scans your entire codebase and surfaces
                  every env var risk before they cause a 3am incident.
                </p>
              </div>

              {/* Trust signals */}
              <div className="mt-12 space-y-3">
                {[
                  '✓ Zero config works on any codebase instantly',
                  '✓ Pure static analysis no data leaves your machine',
                  '✓ Free open source, MIT license',
                  '✓ MCP server connects Claude, Cursor, VS Code',
                ].map((item, i) => (
                  <div key={i} className="font-mono text-sm" style={{ color: '#71797E' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Install options */}
            <div className="p-10 md:p-16" style={{ backgroundColor: '#0D0D0D' }}>
              <div className="font-mono text-xs uppercase tracking-widest mb-8" style={{ color: '#71797E' }}>
                INSTALL_OPTIONS
              </div>

              <div className="space-y-6">
                {/* npx */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#71797E' }}>No install needed</div>
                  <div className="px-5 py-4" style={{ border: '1px solid #00FF66', backgroundColor: '#0A0A0A' }}>
                    <span className="font-mono text-lg font-700" style={{ color: '#00FF66' }}>$ npx envark</span>
                  </div>
                </div>

                {/* global */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#71797E' }}>Global install</div>
                  <div className="px-5 py-3" style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}>
                    <span className="font-mono text-sm" style={{ color: '#A8A9AD' }}>$ npm install -g envark</span>
                  </div>
                </div>

                {/* bun */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#71797E' }}>Bun</div>
                  <div className="px-5 py-3" style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}>
                    <span className="font-mono text-sm" style={{ color: '#A8A9AD' }}>$ bunx envark</span>
                  </div>
                </div>

                {/* IDE setup */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#71797E' }}>MCP auto-configure IDE</div>
                  <div className="space-y-2">
                    {['envark init vscode', 'envark init claude', 'envark init cursor', 'envark init windsurf'].map((cmd) => (
                      <div key={cmd} className="px-5 py-3" style={{ border: '1px solid #2A2A2A', backgroundColor: '#0A0A0A' }}>
                        <span className="font-mono text-sm" style={{ color: '#A8A9AD' }}>$ {cmd}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <a
                    href="https://github.com/kstij/Envark"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm uppercase tracking-widest px-6 py-4 inline-block flex-1 text-center"
                    style={{ border: '1px solid #2A2A2A', color: '#FAFAFA' }}
                  >
                    GitHub →
                  </a>
                  <a
                    href="https://kstij-envark.mintlify.app/quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-green font-mono text-sm uppercase tracking-widest px-6 py-4 inline-block flex-1 text-center"
                  >
                    Docs →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
