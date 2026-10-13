export function TokenIcon({ symbol, size = 18, style = {} }) {
  const sym = (symbol || "").toUpperCase();

  const baseStyle = {
    display: "inline-block",
    verticalAlign: "middle",
    borderRadius: "50%",
    flexShrink: 0,
    ...style
  };

  if (sym === "THRU") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={baseStyle}>
        <circle cx="16" cy="16" r="16" fill="#C0392B" />
        <path d="M7.5 9.5h17v3.2h-6.7v10.8h-3.6V12.7H7.5V9.5z" fill="#ffffff" />
        <circle cx="21" cy="20.5" r="2.2" fill="#ffffff" />
      </svg>
    );
  }

  if (sym === "TSOL" || sym === "SOL") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={baseStyle}>
        <circle cx="16" cy="16" r="16" fill="#131021" />
        <defs>
          <linearGradient id={`solGrad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#DC1FFF" />
          </linearGradient>
        </defs>
        {/* Solana 3 gradient bars */}
        <path d="M9 11.2h11.2l2.8 2.6H11.8z" fill={`url(#solGrad_${size})`} />
        <path d="M23 14.8H11.8l-2.8 2.6H20.2z" fill={`url(#solGrad_${size})`} />
        <path d="M9 18.4h11.2l2.8 2.6H11.8z" fill={`url(#solGrad_${size})`} />
      </svg>
    );
  }

  if (sym === "TUSD" || sym === "USD" || sym === "USDT" || sym === "USDC") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={baseStyle}>
        <circle cx="16" cy="16" r="16" fill="#059669" />
        <circle cx="16" cy="16" r="13.2" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />
        <text
          x="16"
          y="21.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="15"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          $
        </text>
      </svg>
    );
  }

  if (sym === "TETH" || sym === "ETH") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={baseStyle}>
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g transform="translate(8.8, 5.5) scale(0.45)">
          <polygon points="16,0 15.6,1.4 15.6,22 16,22.4 25.5,16.7" fill="#ffffff" fillOpacity="0.75" />
          <polygon points="16,0 6.5,16.7 16,22.4" fill="#ffffff" />
          <polygon points="16,24.3 15.7,24.6 15.7,35.6 16,36 25.5,18.8" fill="#ffffff" fillOpacity="0.75" />
          <polygon points="16,36 16,24.3 6.5,18.8" fill="#ffffff" />
          <polygon points="16,22.4 25.5,16.7 16,12.5" fill="#ffffff" fillOpacity="0.4" />
          <polygon points="6.5,16.7 16,22.4 16,12.5" fill="#ffffff" fillOpacity="0.6" />
        </g>
      </svg>
    );
  }

  if (sym === "TBTC" || sym === "BTC") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={baseStyle}>
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M21.5 14c.3-1.8-.7-2.8-2.5-3.3l.5-2-1.2-.3-.5 2c-.3-.1-.7-.2-1-.3l.5-2.1-1.2-.3-.5 2.1c-.3-.1-.5-.1-.8-.2l-1.7-.4-.3 1.4s.9.2.9.2c.5.1.6.4.6.6l-.6 2.5c0 0 .1 0 .2.1l-.2-.1-.9 3.6c-.1.2-.3.4-.6.3 0 0-.9-.2-.9-.2l-.6 1.4 1.6.4c.3.1.6.2.9.2l-.5 2.2 1.2.3.5-2.1c.3.1.7.2 1 .2l-.5 2.1 1.2.3.5-2.1c2.1.4 3.7.2 4.3-1.6.5-1.5 0-2.3-1.1-2.9.8-.4 1.4-1.1 1.2-2.3zm-2.2 4.8c-.4 1.5-2.9.7-3.8.5l.7-2.7c.9.2 3.5.7 3.1 2.2zm.4-4.8c-.3 1.4-2.5.7-3.2.5l.6-2.5c.7.2 2.9.6 2.6 2z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#7a8a9a", ...baseStyle }} />
  );
}
