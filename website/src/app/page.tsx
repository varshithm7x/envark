'use client';

import { useRef, useState } from "react";
import { ArrowRight, Terminal, Shield, Zap, Lock, Database, Check, Menu, X } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MetallicAsterisk } from "@/components/MetallicAsterisk";
import { MCPInstall } from "@/components/MCPInstall";

/* 
  Each line gets its own scroll-linked highlight bar.
  The bar width is driven by how far the line's container has scrolled
  through the viewport — starts at 0% when entering, reaches 100% mid-screen,
  and collapses back to 0% when scrolling back up past it.
*/
const ScrollHighlight = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.45"],
  });
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={ref} className="relative w-fit mb-1.5">
      {/* Highlight bar behind text */}
      <motion.div 
        className="absolute inset-y-0 left-0 bg-[#f0ece1] rounded-[2px]"
        style={{ width, zIndex: 0 }}
      />
      <span className="relative z-10 px-3 py-1 text-[#52525b] block">
        {children}
      </span>
      {/* Dark text overlay clipped to highlight width */}
      <motion.div 
        className="absolute inset-0 overflow-hidden rounded-[2px]"
        style={{ width, zIndex: 2 }}
      >
        <span className="px-3 py-1 text-[#131313] block whitespace-nowrap font-medium">
          {children}
        </span>
      </motion.div>
    </div>
  );
};

/* Shield shape — 11 cols, hollow arch top + solid body + taper to point */
const SHIELD_GRID = [
  // Hollow arch/dome top
  0,0,0,1,1,1,1,1,0,0,0,
  0,0,1,1,0,0,0,1,1,0,0,
  0,1,1,0,0,0,0,0,1,1,0,
  1,1,0,0,0,0,0,0,0,1,1,
  // Solid body
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,
  // Taper to point
  0,1,1,1,1,1,1,1,1,1,0,
  0,0,1,1,1,1,1,1,1,0,0,
  0,0,0,1,1,1,1,1,0,0,0,
  0,0,0,0,1,1,1,0,0,0,0,
  0,0,0,0,0,1,0,0,0,0,0,
];
const SHIELD_COLORS = ['bg-[#131313]', 'bg-zinc-300', 'bg-zinc-700', 'bg-[#f4a261]', 'bg-[#48cae4]', 'bg-[#d0bdf4]'];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#131313] text-[#f5f5f0] font-sans selection:bg-[#7fffb6] selection:text-black overflow-x-hidden">
      
      {/* Dark Section - Hero combined */}
      <div 
        className="w-full relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Navbar */}
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto z-20 relative">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer">
            ENVARK
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-10 text-[11px] font-mono tracking-widest uppercase text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="https://kstij-envark.mintlify.app/quickstart" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200 flex items-center gap-1">Docs ↗</a>
            <a href="#mcp" className="hover:text-white transition-colors duration-200">MCP Plugin</a>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <a href="https://github.com/kstij/Envark" target="_blank" rel="noopener noreferrer">
              <button className="bg-[#7fffb6] text-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold tracking-wide uppercase hover:bg-[#6be0a0] transition-colors">
                Github
              </button>
            </a>
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-[#131313] border-t border-white/10 md:hidden z-50">
              <div className="px-4 py-6 space-y-4">
                <a href="#features" className="block text-zinc-400 hover:text-white transition-colors duration-200 text-sm uppercase tracking-wide">Features</a>
                <a href="https://kstij-envark.mintlify.app/quickstart" target="_blank" rel="noopener noreferrer" className="block text-zinc-400 hover:text-white transition-colors duration-200 text-sm uppercase tracking-wide">Docs ↗</a>
                <a href="#mcp" className="block text-zinc-400 hover:text-white transition-colors duration-200 text-sm uppercase tracking-wide">MCP Plugin</a>
              </div>
            </div>
          )}
        </nav>

        {/* Top Hero Layout: Left Text, Right Asterisk */}
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 pt-8 sm:pt-10 lg:pt-0 xl:pt-4 pb-8 sm:pb-12 lg:pb-16 xl:pb-20 relative z-10 flex flex-col lg:grid lg:grid-cols-2 items-center gap-6 lg:gap-8">
          
          {/* Asterisk — hidden on mobile, visible on lg+ */}
          <div className="relative w-full hidden lg:flex items-center justify-center h-[450px] lg:h-[500px] xl:h-[600px] lg:-mr-10 order-2">
            <MetallicAsterisk />
          </div>

          {/* Text + CTA — always first visually */}
          <div className="flex flex-col items-start text-left w-full order-1 min-w-0">
            <h1 className="text-[2rem] sm:text-[2.75rem] md:text-6xl lg:text-6xl xl:text-[5.5rem] font-medium tracking-tighter mb-8 text-white w-full" style={{ lineHeight: '1.05' }}>
              Your environment<br />variable guardian
            </h1>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="bg-[#7fffb6] text-black px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase hover:bg-[#6be0a0] transition-colors flex items-center gap-2 cursor-pointer">
                INSTALL NOW <ArrowRight className="w-4 h-4" />
              </button>
              <a href="https://kstij-envark.mintlify.app/quickstart" target="_blank" rel="noopener noreferrer">
                <button className="border border-zinc-700 text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer bg-black/20 backdrop-blur-sm">
                  DOCS
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Lower Hero layout - The Terminal Visual spanning width */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-8 sm:pb-16 relative z-10">
          <MCPInstall />
        </div>
      </div>

      {/* Second Section - Scroll-linked highlight reveal */}
      <section className="bg-[#131313] py-20 sm:py-32 lg:py-40 relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
          <div className="flex flex-col items-start font-medium text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem] leading-[1.4] sm:leading-[1.3] tracking-tight">
            <ScrollHighlight>Scan, validate, and lock down</ScrollHighlight>
            <ScrollHighlight>every secret across your</ScrollHighlight>
            <ScrollHighlight>entire stack — automatically.</ScrollHighlight>
            <div className="h-6 sm:h-8" />
            <ScrollHighlight>The open-source environment</ScrollHighlight>
            <ScrollHighlight>variable guardian with</ScrollHighlight>
            <ScrollHighlight>native MCP support.</ScrollHighlight>
          </div>
        </div>
      </section>

      {/* Third Section - Light Background */}
      <section 
        id="features"
        className="w-full relative overflow-hidden py-20 sm:py-24 lg:py-32 text-[#131313]"
        style={{
          backgroundColor: '#f5f4ef',
          backgroundImage: 'radial-gradient(circle at center, #d1d1cd 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#e85d04] mb-6 sm:mb-8 font-bold text-center lg:text-left">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-medium tracking-tight mb-16 sm:mb-20 lg:mb-24 text-center lg:text-left">
            Reliable. <span className="text-zinc-400 font-light">❖</span> Scalable. <span className="text-zinc-400 font-light">✶</span> Secure.
          </h2>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-24">
            <div className="flex flex-col gap-8 sm:gap-12 max-w-2xl mx-auto lg:mx-0">
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-zinc-300 pb-8 sm:pb-12">
                <div className="w-12 h-12 sm:w-16 sm:h-12 rounded-full bg-[#d0bdf4] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 w-full justify-between items-center sm:items-start text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-medium shrink-0">Scan &amp; Validate</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm sm:text-[15px]">
                    Scans your entire codebase for env usage, validates your .env files, and flags missing or risky variables before they hit production.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-zinc-300 pb-8 sm:pb-12">
                <div className="w-12 h-12 sm:w-16 sm:h-12 rounded-full bg-[#f4a261] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 w-full justify-between items-center sm:items-start text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-medium shrink-0">Multi-language</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm sm:text-[15px]">
                    JS, TypeScript, Python, Go, Rust, and Docker — parsed and checked automatically. Generates .env.example templates in seconds.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-zinc-300 pb-8 sm:pb-12">
                <div className="w-12 h-12 sm:w-16 sm:h-12 rounded-full bg-[#48cae4] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 w-full justify-between items-center sm:items-start text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-medium shrink-0">AI Chat &amp; MCP</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm sm:text-[15px]">
                    Built-in AI chat mode, risk analysis, and dependency graphs. Operates natively as an MCP server in Cursor, Windsurf, or Claude.
                  </p>
                </div>
              </div>

            </div>

            <div className="relative hidden lg:flex items-center justify-center h-full">
               <div className="grid grid-cols-11 gap-x-2 gap-y-1.5 w-fit">
                  {SHIELD_GRID.map((active, i) => (
                    <div 
                      key={i} 
                      className={`w-9 h-3 rounded-full ${
                        active 
                          ? SHIELD_COLORS[(i * 7 + 3) % SHIELD_COLORS.length]
                          : 'opacity-0 pointer-events-none'
                      }`} 
                    />
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENVARK Footer */}
      <section className="w-full bg-[#131313] pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 overflow-hidden border-t border-white/5">
        <div className="w-full flex justify-center px-4">
          <motion.h2 
            className="font-bold tracking-tighter select-none text-center relative"
            style={{ 
              fontSize: 'clamp(3rem, 15vw, 20rem)', 
              lineHeight: '0.85',
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
          >
            {/* Outline layer */}
            <motion.span
              className="block"
              style={{
                color: 'transparent',
                WebkitTextStroke: '2px rgba(245, 245, 240, 0.15)',
              }}
              variants={{
                hidden: { opacity: 0, y: 60 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                },
              }}
            >
              ENVARK
            </motion.span>
            {/* Fill sweep layer — clips from left to right */}
            <motion.span
              className="absolute inset-0 block overflow-hidden"
              style={{
                color: 'transparent',
                WebkitTextStroke: '2px rgba(127, 255, 182, 0.35)',
              }}
              variants={{
                hidden: { clipPath: 'inset(0 100% 0 0)' },
                visible: { 
                  clipPath: 'inset(0 0% 0 0)',
                  transition: { duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }
                },
              }}
            >
              ENVARK
            </motion.span>
          </motion.h2>
        </div>
      </section>

    </div>
  );
}
