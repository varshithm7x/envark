'use client';

import { useState } from 'react';

const ides = [
  { id: 'claude', label: 'Claude Code', file: '.mcp.json' },
  { id: 'cursor', label: 'Cursor', file: '.cursor/mcp.json' },
  { id: 'vscode', label: 'VS Code', file: '.vscode/mcp.json' },
  { id: 'windsurf', label: 'Windsurf', file: '.windsurf/mcp.json' },
  { id: 'opencode', label: 'OpenCode', file: '.opencode.json' },
];

const pkgs = [
  { id: 'npx', label: 'npx' },
  { id: 'bunx', label: 'bunx' },
];

function getMcpJson(ide: string, pkg: string): string {
  if (ide === 'vscode') {
    return `{
  "inputs": [],
  "servers": {
    "envark": {
      "type": "stdio",
      "command": "${pkg}",
      "args": [
        "envark",
        "--mcp"
      ]
    }
  }
}`;
  }
  if (ide === 'opencode') {
    return `{
  "mcp": {
    "envark": {
      "type": "local",
      "command": [
        "${pkg}",
        "envark",
        "--mcp"
      ]
    }
  }
}`;
  }
  // Claude Code, Cursor, Windsurf
  return `{
  "mcpServers": {
    "envark": {
      "command": "${pkg}",
      "args": [
        "envark",
        "--mcp"
      ]
    }
  }
}`;
}

function getInitCmd(ide: string, pkg: string): string {
  return `${pkg} envark init ${ide}`;
}

export default function BenchmarkGrid() {
  const [activeIde, setActiveIde] = useState('claude');
  const [activePkg, setActivePkg] = useState('npx');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const ideObj = ides.find((i) => i.id === activeIde)!;
  const mcpJson = getMcpJson(activeIde, activePkg);
  const initCmd = getInitCmd(activeIde, activePkg);

  const copyJson = () => {
    navigator.clipboard.writeText(mcpJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const copyCmd = () => {
    navigator.clipboard.writeText(initCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1500);
  };

  return (
    <section className="section-white" style={{ borderBottom: '1px solid #D0D0D0' }}>
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        {/* Header */}
        <div className="mb-16">
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#71797E' }}>
            // MCP_SETUP Connect Your AI Assistant
          </span>
          <h2
            className="font-mono font-800 mt-4 leading-none tracking-tightest"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#111111' }}
          >
            PLUG ENVARK INTO<br />
            <span style={{ color: '#71797E' }}>YOUR AI. ONE COMMAND.</span>
          </h2>
          <p className="font-mono mt-4 text-sm" style={{ color: '#71797E', maxWidth: '520px' }}>
            Envark runs as an MCP server giving Claude, Cursor, VS Code, and Windsurf
            direct access to your environment variable map, risk report, and validation tools.
          </p>
        </div>

        {/* IDE + Package tabs + code panel */}
        <div style={{ border: '1px solid #2A2A2A', backgroundColor: '#111111' }}>
          {/* Tab bar */}
          <div
            className="flex items-center justify-between flex-wrap"
            style={{ borderBottom: '1px solid #2A2A2A' }}
          >
            {/* IDE tabs */}
            <div className="flex overflow-x-auto">
              {ides.map((ide) => (
                <button
                  key={ide.id}
                  onClick={() => setActiveIde(ide.id)}
                  className="font-mono text-xs px-5 py-3 whitespace-nowrap outline-none"
                  style={{
                    color: activeIde === ide.id ? '#FAFAFA' : '#71797E',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: activeIde === ide.id ? '2px solid #00FF66' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {ide.label}
                </button>
              ))}
            </div>
            {/* Package tabs */}
            <div className="flex gap-2 px-4 py-2">
              {pkgs.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setActivePkg(pkg.id)}
                  className="font-mono text-xs px-4 py-2 outline-none"
                  style={{
                    color: activePkg === pkg.id ? '#111111' : '#71797E',
                    backgroundColor: activePkg === pkg.id ? '#FAFAFA' : 'transparent',
                    border: '1px solid',
                    borderColor: activePkg === pkg.id ? '#FAFAFA' : '#2A2A2A',
                    cursor: 'pointer',
                  }}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
          </div>

          {/* JSON config block */}
          <div style={{ borderBottom: '1px solid #2A2A2A' }}>
            <div
              className="flex items-center justify-between px-5 py-2"
              style={{ borderBottom: '1px solid #2A2A2A', backgroundColor: '#0D0D0D' }}
            >
              <span className="font-mono text-xs" style={{ color: '#71797E' }}>{ideObj.file}</span>
              <button
                onClick={copyJson}
                className="font-mono text-xs px-3 py-1 outline-none"
                style={{
                  color: copiedJson ? '#00FF66' : '#71797E',
                  border: '1px solid',
                  borderColor: copiedJson ? '#00FF66' : '#2A2A2A',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {copiedJson ? 'copied' : 'copy'}
              </button>
            </div>
            <pre
              className="font-mono text-sm px-6 py-6 overflow-x-auto"
              style={{ color: '#FAFAFA', lineHeight: 1.7, margin: 0 }}
            >
              {mcpJson}
            </pre>
          </div>

          {/* Terminal init command */}
          <div>
            <div
              className="flex items-center justify-between px-5 py-2"
              style={{ borderBottom: '1px solid #2A2A2A', backgroundColor: '#0D0D0D' }}
            >
              <span className="font-mono text-xs" style={{ color: '#71797E' }}>Terminal</span>
              <button
                onClick={copyCmd}
                className="font-mono text-xs px-3 py-1 outline-none"
                style={{
                  color: copiedCmd ? '#00FF66' : '#71797E',
                  border: '1px solid',
                  borderColor: copiedCmd ? '#00FF66' : '#2A2A2A',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {copiedCmd ? 'copied' : 'copy'}
              </button>
            </div>
            <div className="px-6 py-6">
              <span className="font-mono text-sm" style={{ color: '#00FF66' }}>$ {initCmd}</span>
            </div>
          </div>
        </div>

        {/* Bottom notes */}
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
          {[
            'Auto-writes config to the correct IDE location',
            'Works with Claude Code, Cursor, VS Code, Windsurf, OpenCode',
            'Or configure manually using the JSON above',
          ].map((note, i) => (
            <span key={i} className="font-mono text-xs" style={{ color: '#71797E' }}>
              ✓ {note}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}