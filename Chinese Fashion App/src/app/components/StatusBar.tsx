interface StatusBarProps {
  dark?: boolean;
}

export function StatusBar({ dark = false }: StatusBarProps) {
  const textColor = dark ? "rgba(255,255,255,0.92)" : "#1F1F24";

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 flex justify-between items-end px-6 pb-1"
      style={{ height: "44px", paddingTop: "14px" }}
    >
      <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.3px", color: textColor, fontFamily: "Inter, system-ui" }}>
        9:41
      </span>
      <div className="flex items-center gap-[5px]">
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="0.5" fill={textColor} />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill={textColor} />
          <rect x="9" y="3" width="3" height="9" rx="0.5" fill={textColor} />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={textColor} opacity="0.3" />
        </svg>
        {/* Wifi */}
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
          <path d="M7.5 10.5C8.05 10.5 8.5 10.05 8.5 9.5C8.5 8.95 8.05 8.5 7.5 8.5C6.95 8.5 6.5 8.95 6.5 9.5C6.5 10.05 6.95 10.5 7.5 10.5Z" fill={textColor} />
          <path d="M4.8 7.8C5.5 7.1 6.45 6.7 7.5 6.7C8.55 6.7 9.5 7.1 10.2 7.8" stroke={textColor} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2.5 5.5C3.7 4.3 5.5 3.5 7.5 3.5C9.5 3.5 11.3 4.3 12.5 5.5" stroke={textColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <path d="M0.5 3.2C2.1 1.6 4.7 0.5 7.5 0.5C10.3 0.5 12.9 1.6 14.5 3.2" stroke={textColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke={textColor} strokeOpacity="0.35" />
          <rect x="22" y="3.5" width="2" height="5" rx="1" fill={textColor} fillOpacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill={textColor} />
        </svg>
      </div>
    </div>
  );
}
