export default function Logo({ className = "", textColor = "text-black" }: { className?: string; textColor?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        {/* Rounded rectangle background - solid blue */}
        <rect
          x="0"
          y="0"
          width="48"
          height="48"
          rx="12"
          fill="#2563EB"
          filter="url(#shadow)"
        />
        
        {/* Lightning bolt icon */}
        <path
          d="M26 12L18 26H24L22 36L30 22H24L26 12Z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
      
      <div className="text-2xl font-bold tracking-tight">
        <span className={textColor}>MUDASIR </span>
        <span className="text-blue-600">TRADERS</span>
      </div>
    </div>
  );
}
