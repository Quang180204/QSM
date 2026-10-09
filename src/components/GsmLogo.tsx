
export default function GsmLogo({
  size = 36,
  showSub = true,
}: {
  size?: number;
  showSub?: boolean;
}) {
  return (
    <div className="gsm-brand-lockup">
      <div
        className="gsm-brand-icon-wrap"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="gsm-brand-svg"
        >
          <defs>
            <linearGradient id="gsmGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5d4" />
              <stop offset="50%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="gsmGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0077b6" stopOpacity="0.1" />
            </linearGradient>
            <filter id="gsmNeon" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer cyber ring */}
          <circle
            cx="24"
            cy="24"
            r="21"
            stroke="url(#gsmGradGlow)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* Glowing aerodynamic polygon backdrop */}
          <path
            d="M24 6L40 15V33L24 42L8 33V15L24 6Z"
            fill="rgba(0, 245, 212, 0.08)"
            stroke="url(#gsmGrad1)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Dynamic GSM Electric 'G' Emblem */}
          <path
            d="M29 16C27.5 15.2 25.8 14.8 24 14.8C18.9 14.8 14.8 18.9 14.8 24C14.8 29.1 18.9 33.2 24 33.2C28.2 33.2 31.8 30.4 32.8 26.5H24"
            stroke="url(#gsmGrad1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#gsmNeon)"
          />

          {/* Electric Bolt Accent inside the G */}
          <path
            d="M26 20L21 26.5H27L24 31"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Orbiting Tech Light Particle */}
          <circle cx="36" cy="17" r="2.2" fill="#00f5d4" className="gsm-pulse-node" />
        </svg>
        <span className="gsm-icon-ambient" />
      </div>

      <div className="gsm-brand-text">
        <div className="gsm-brand-title">
          <span className="gsm-title-gradient">GSM</span>
          <span className="gsm-badge-year">AI</span>
        </div>
        {showSub && (
          <div className="gsm-brand-subtitle">
            <span className="gsm-dot" />
            <span>SMART MOBILITY</span>
          </div>
        )}
      </div>
    </div>
  );
}
