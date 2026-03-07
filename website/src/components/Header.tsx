'use client';

export default function Header() {

  return (
    <>
      {/* Main Nav */}
      <nav
        style={{ backgroundColor: '#111111', borderBottom: '1px solid #2A2A2A' }}
        className="fixed top-0 left-0 w-full z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <span
            className="font-mono font-800 uppercase tracking-widest"
            style={{ color: '#00FF66', fontSize: '1.4rem' }}
          >
            ENVARK
          </span>

          {/* Right icon badges */}
          <div className="flex items-center gap-8">
            {/* npm logo icon */}
            <a
              href="https://npmjs.com/package/envark"
              target="_blank"
              rel="noopener noreferrer"
              title="View on npm"
              className="flex items-center"
            >
              <svg width="34" height="34" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <rect width="256" height="256" fill="#CB3837" />
                {/* white "n" shape */}
                <rect x="64" y="64" width="32" height="128" fill="white" />
                <rect x="64" y="64" width="128" height="32" fill="white" />
                <rect x="160" y="64" width="32" height="128" fill="white" />
              </svg>
            </a>

            {/* GitHub icon */}
            <a
              href="https://github.com/kstij/Envark"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center transition-colors duration-150"
              style={{ color: '#71797E' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}