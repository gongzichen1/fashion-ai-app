import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StatusBar } from "./components/StatusBar";
import { BottomNav } from "./components/BottomNav";
import { HomePage } from "./components/HomePage";
import { CameraPage } from "./components/CameraPage";
import { ResultPage } from "./components/ResultPage";
import { ProfilePage } from "./components/ProfilePage";
import { StylePreferencesPage } from "./components/StylePreferencesPage";
import { BodyProfilePage } from "./components/BodyProfilePage";
import { FeedbackPage } from "./components/FeedbackPage";
import { AboutPage } from "./components/AboutPage";

type Page =
  | "home"
  | "camera"
  | "result"
  | "profile"
  | "style-prefs"
  | "body-profile"
  | "feedback"
  | "about";

type Tab = "home" | "camera" | "profile";
type CamState = "viewfinder" | "preview" | "analyzing" | "failed";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [cameraState, setCameraState] = useState<CamState>("viewfinder");

  const navigate = (page: Page) => {
    setActivePage(page);
    if (page === "home") setActiveTab("home");
    else if (page === "camera") {
      setActiveTab("camera");
      setCameraState("viewfinder");
    } else if (page === "profile") setActiveTab("profile");
  };

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "home") setActivePage("home");
    else if (tab === "camera") {
      setActivePage("camera");
      setCameraState("viewfinder");
    } else if (tab === "profile") setActivePage("profile");
  };

  const isCameraMode = activePage === "camera";

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onNavigate={navigate} />;
      case "result":
        return <ResultPage onNavigate={navigate} />;
      case "profile":
        return <ProfilePage onNavigate={navigate} />;
      case "style-prefs":
        return <StylePreferencesPage onBack={() => navigate("profile")} />;
      case "body-profile":
        return <BodyProfilePage onBack={() => navigate("profile")} />;
      case "feedback":
        return <FeedbackPage onBack={() => navigate("profile")} />;
      case "about":
        return <AboutPage onBack={() => navigate("profile")} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(145deg, #E8E0D8 0%, #D4CBC2 50%, #E0D5CC 100%)",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,183,200,0.25) 0%, transparent 70%)",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="fixed bottom-0 right-0 pointer-events-none"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(158,183,178,0.2) 0%, transparent 70%)",
          transform: "translate(30%, 30%)",
        }}
      />

      {/* Phone frame */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          width: 375,
          height: 812,
          borderRadius: 52,
          background: "#F8F6F2",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.22), 0 60px 120px rgba(0,0,0,0.14)",
        }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[60]"
          style={{
            top: 12,
            width: isCameraMode ? 120 : 126,
            height: 34,
            borderRadius: 20,
            background: "#0A0A0E",
            transition: "all 0.3s",
          }}
        />

        {/* Camera full-screen mode */}
        <AnimatePresence>
          {isCameraMode && (
            <motion.div
              key="camera"
              className="absolute inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CameraPage
                state={cameraState}
                onCapture={() => setCameraState("preview")}
                onAnalyzed={() => {
                  setActivePage("result");
                  setActiveTab("camera");
                }}
                onFailed={() => setCameraState("failed")}
                onBack={() => navigate("home")}
                onReset={() => setCameraState("viewfinder")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal pages */}
        {!isCameraMode && (
          <>
            {/* Status bar */}
            <StatusBar />

            {/* Page content */}
            <div
              className="absolute left-0 right-0 overflow-y-auto"
              style={{
                top: 44,
                bottom: 83,
                scrollbarWidth: "none",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom nav */}
            <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
          </>
        )}
      </div>

      {/* Desktop label */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          className="px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.4)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 2L9 5H12L9.5 7.5L10.5 11L7 9L3.5 11L4.5 7.5L2 5H5L7 2Z" fill="#C890A8" />
          </svg>
          <span
            style={{
              fontSize: 11,
              color: "rgba(31,31,36,0.65)",
              fontFamily: "Inter, system-ui",
            }}
          >
            智搭 StyleMind AI · WeChat Mini Program UI
          </span>
        </div>
      </div>
    </div>
  );
}
