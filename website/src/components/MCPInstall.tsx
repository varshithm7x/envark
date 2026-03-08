"use client";

import { useState } from "react";

const editors = ["Claude Code", "Cursor", "VS Code", "Windsurf", "OpenCode"] as const;
type Editor = (typeof editors)[number];
type Runner = "npx" | "bunx" | "npm";

type EditorConfig = {
    file: string;
    json: (runner: Runner) => string;
};

const EDITOR_CONFIGS: Record<Editor, EditorConfig> = {
    "Claude Code": {
        file: ".mcp.json",
        json: (r) => `{
  "mcpServers": {
    "envark": {
      "command": "${r}",
      "args": ["envark"]
    }
  }
}`,
    },
    Cursor: {
        file: "~/.cursor/mcp.json",
        json: (r) => `{
  "mcpServers": {
    "envark": {
      "command": "${r}",
      "args": ["envark"]
    }
  }
}`,
    },
    "VS Code": {
        file: ".vscode/settings.json",
        json: (r) => `{
  "mcp": {
    "servers": {
      "envark": {
        "type": "stdio",
        "command": "${r}",
        "args": ["envark"]
      }
    }
  }
}`,
    },
    Windsurf: {
        file: "~/.codeium/windsurf/mcp_config.json",
        json: (r) => `{
  "mcpServers": {
    "envark": {
      "command": "${r}",
      "args": ["envark"]
    }
  }
}`,
    },
    OpenCode: {
        file: "~/.config/opencode/config.json",
        json: (r) => `{
  "mcp": {
    "envark": {
      "command": "${r}",
      "args": ["envark"]
    }
  }
}`,
    },
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button
            onClick={copy}
            className="text-zinc-500 hover:text-white font-mono text-xs transition-colors"
        >
            {copied ? "copied!" : "copy"}
        </button>
    );
}

export function MCPInstall() {
    const [activeEditor, setActiveEditor] = useState<Editor>("Claude Code");
    const [runner, setRunner] = useState<Runner>("bunx");

    const config = EDITOR_CONFIGS[activeEditor];
    const jsonText = config.json(runner);
    const terminalCmd = runner === "npm" ? "npx envark init" : `${runner} envark init`;

    return (
        <section id="mcp" className="pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
            <p className="text-zinc-500 font-mono text-[11px] text-center mb-4 tracking-widest uppercase">
                Integration
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-white text-center mb-4 leading-tight">
                Works with your tools.
            </h2>
            <p className="text-zinc-400 text-center text-sm sm:text-base mb-10 sm:mb-16 px-4">
                Drop Envark into your existing workflow in seconds.
            </p>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 xl:gap-16 items-start">
                {/* Left: config setup */}
                <div className="min-w-0">
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="overflow-x-auto -mx-1 px-1">
                            <div className="flex items-center gap-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl p-1 w-fit">
                                {editors.map((e) => (
                                    <button
                                        key={e}
                                        onClick={() => setActiveEditor(e)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                                            activeEditor === e
                                                ? "bg-white text-black"
                                                : "text-zinc-400 hover:text-zinc-200"
                                        }`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-zinc-800 rounded-xl p-1">
                            {(["npx", "bunx", "npm"] as Runner[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRunner(r)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-mono transition-all duration-150 ${
                                        runner === r
                                            ? "bg-white text-black"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-[#0d0d0d]">
                            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-800/60">
                                <span className="font-mono text-xs text-zinc-500 truncate">{config.file}</span>
                                <CopyButton text={jsonText} />
                            </div>
                            <pre className="px-4 sm:px-5 py-4 text-xs sm:text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                                {jsonText}
                            </pre>
                        </div>

                        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-[#0d0d0d]">
                            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-800/60">
                                <span className="font-mono text-xs text-zinc-500">Terminal</span>
                                <CopyButton text={terminalCmd} />
                            </div>
                            <pre className="px-4 sm:px-5 py-4 text-xs sm:text-sm font-mono text-zinc-300">
                                {terminalCmd}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Right: Envark capabilities */}
                <div className="border border-zinc-800 rounded-2xl bg-[#0d0d0d] overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-zinc-800/60 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#7fffb6]" />
                        <span className="font-mono text-xs text-zinc-400 tracking-wider uppercase">Envark Commands</span>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col gap-0.5 font-mono text-xs sm:text-sm">
                        {[
                            { cmd: "/scan", desc: "Scan project for env variables" },
                            { cmd: "/validate", desc: "Validate a .env file" },
                            { cmd: "/missing", desc: "Find undefined but used variables" },
                            { cmd: "/risk", desc: "Analyze environment variable risks" },
                            { cmd: "/duplicates", desc: "Find duplicate definitions" },
                            { cmd: "/generate", desc: "Generate .env.example template" },
                            { cmd: "/graph", desc: "Show variable dependency graph" },
                            { cmd: "/chat", desc: "Start AI chat mode" },
                            { cmd: "/ask", desc: "Quick AI question" },
                        ].map((item) => (
                            <div key={item.cmd} className="flex items-start gap-3 py-2 sm:py-2.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                                <span className="text-[#7fffb6] w-[90px] sm:w-[110px] shrink-0 text-left">{item.cmd}</span>
                                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors leading-relaxed">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 sm:px-5 py-3 border-t border-zinc-800/60 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600 font-mono tracking-wide">JS · TS · Python · Go · Rust · Docker</span>
                    </div>
                </div>
            </div>
        </section>
    );
}