

export default function Footer() {
  const year = new Date()?.getFullYear();

  return (
    <footer
      style={{ backgroundColor: '#111111', borderTop: '1px solid #2A2A2A' }}
      className="py-8"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <span
              className="font-mono font-700 text-sm uppercase tracking-widest"
              style={{ color: '#00FF66' }}
            >
              ENVARK
            </span>
            <span style={{ color: '#2A2A2A' }}>|</span>
            <a href="https://npmjs.com/package/envark" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-white transition-colors" style={{ color: '#71797E' }}>npm</a>
            <a href="https://github.com/kstij/Envark" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-white transition-colors" style={{ color: '#71797E' }}>GitHub</a>
            <a href="https://npmjs.com/package/envark" target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:text-white transition-colors" style={{ color: '#71797E' }}>Docs</a>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-xs px-3 py-1" style={{ border: '1px solid #2A2A2A', color: '#71797E' }}>MIT License</span>
            <span className="font-mono text-xs px-3 py-1" style={{ border: '1px solid #2A2A2A', color: '#71797E' }}>v0.1.2</span>
            <span className="font-mono text-sm" style={{ color: '#2A2A2A' }}>© {year} Envark</span>
          </div>
        </div>
      </div>
    </footer>
  );
}