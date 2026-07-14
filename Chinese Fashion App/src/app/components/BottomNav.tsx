import { motion } from "motion/react";

type Tab = "home" | "camera" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? "#E8B7C8" : "#B0B0BC";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? "#E8B7C8" : "#B0B0BC";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0" style={{ height: "83px", zIndex: 40 }}>
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(248, 246, 242, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "0.5px solid rgba(31,31,36,0.07)",
        }}
      />

      {/* Tabs */}
      <div className="relative flex items-start justify-around" style={{ paddingTop: "10px", paddingLeft: "16px", paddingRight: "16px" }}>
        {/* 首页 */}
        <button
          onClick={() => onTabPress("home")}
          className="flex flex-col items-center gap-[3px] w-16 transition-opacity active:opacity-70"
        >
          <HomeIcon active={activeTab === "home"} />
          <span style={{ fontSize: 10, color: activeTab === "home" ? "#E8B7C8" : "#B0B0BC", fontFamily: "system-ui, -apple-system", letterSpacing: "0.2px" }}>
            首页
          </span>
        </button>

        {/* Center space */}
        <div className="w-16" />

        {/* 我的 */}
        <button
          onClick={() => onTabPress("profile")}
          className="flex flex-col items-center gap-[3px] w-16 transition-opacity active:opacity-70"
        >
          <ProfileIcon active={activeTab === "profile"} />
          <span style={{ fontSize: 10, color: activeTab === "profile" ? "#E8B7C8" : "#B0B0BC", fontFamily: "system-ui, -apple-system", letterSpacing: "0.2px" }}>
            我的
          </span>
        </button>
      </div>

      {/* Floating camera button */}
      <motion.button
        onClick={() => onTabPress("camera")}
        whileTap={{ scale: 0.93 }}
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          top: "-22px",
          width: "58px",
          height: "58px",
          borderRadius: "29px",
          background: activeTab === "camera"
            ? "linear-gradient(145deg, #E8B7C8 0%, #D9A1B8 100%)"
            : "linear-gradient(145deg, #ECC5D4 0%, #E8B7C8 100%)",
          boxShadow: "0 6px 24px rgba(232, 183, 200, 0.50), 0 2px 8px rgba(232, 183, 200, 0.30)",
          border: "2px solid rgba(255,255,255,0.7)",
        }}
      >
        <CameraIcon />
      </motion.button>
    </div>
  );
}
