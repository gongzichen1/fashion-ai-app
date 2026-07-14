import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, RefreshCw, Image, RotateCcw, Check, AlertTriangle, Home } from "lucide-react";

type CameraState = "viewfinder" | "preview" | "analyzing" | "failed";

interface CameraPageProps {
  state: CameraState;
  onCapture: () => void;
  onAnalyzed: () => void;
  onFailed: () => void;
  onBack: () => void;
  onReset: () => void;
}

const analysisSteps = [
  "正在识别服装类型",
  "正在分析颜色与面料",
  "正在匹配穿搭风格",
  "正在生成搭配建议",
];

export function CameraPage({ state, onCapture, onAnalyzed, onFailed, onBack, onReset }: CameraPageProps) {
  const [flashOn, setFlashOn] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [scanY, setScanY] = useState(0);
  const [internalState, setInternalState] = useState(state);

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  useEffect(() => {
    if (internalState !== "analyzing") return;
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      setAnalysisStep(step);
      if (step >= analysisSteps.length - 1) {
        clearInterval(stepInterval);
        setTimeout(() => onAnalyzed(), 800);
      }
    }, 700);
    return () => clearInterval(stepInterval);
  }, [internalState]);

  useEffect(() => {
    if (internalState !== "analyzing") return;
    let y = 0;
    let dir = 1;
    const scanInterval = setInterval(() => {
      y += dir * 2;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setScanY(y);
    }, 20);
    return () => clearInterval(scanInterval);
  }, [internalState]);

  const handleCapture = () => {
    setInternalState("preview");
    onCapture();
  };

  const handleAnalyze = () => {
    setInternalState("analyzing");
    setAnalysisStep(0);
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0E] flex flex-col" style={{ zIndex: 100 }}>
      {/* Status bar dark */}
      <div className="flex justify-between items-end px-6" style={{ paddingTop: "14px", height: "44px" }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)", fontFamily: "Inter, system-ui" }}>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="rgba(255,255,255,0.85)" /><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="rgba(255,255,255,0.85)" /><rect x="9" y="3" width="3" height="9" rx="0.5" fill="rgba(255,255,255,0.85)" /><rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="rgba(255,255,255,0.35)" /></svg>
          <svg width="15" height="12" viewBox="0 0 15 12" fill="none"><path d="M7.5 10.5C8.05 10.5 8.5 10.05 8.5 9.5C8.5 8.95 8.05 8.5 7.5 8.5C6.95 8.5 6.5 8.95 6.5 9.5C6.5 10.05 6.95 10.5 7.5 10.5Z" fill="rgba(255,255,255,0.85)" /><path d="M4.8 7.8C5.5 7.1 6.45 6.7 7.5 6.7C8.55 6.7 9.5 7.1 10.2 7.8" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" /><path d="M2.5 5.5C3.7 4.3 5.5 3.5 7.5 3.5C9.5 3.5 11.3 4.3 12.5 5.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" /></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="rgba(255,255,255,0.4)" /><rect x="22" y="3.5" width="2" height="5" rx="1" fill="rgba(255,255,255,0.4)" /><rect x="2" y="2" width="16" height="8" rx="1.5" fill="rgba(255,255,255,0.85)" /></svg>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex justify-between items-center px-5 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
          <X size={18} color="white" />
        </motion.button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "white" }}>
          {internalState === "preview" ? "预览" : internalState === "analyzing" ? "AI分析中" : "拍照识衣"}
        </span>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFlashOn(!flashOn)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: flashOn ? "rgba(255,220,100,0.2)" : "rgba(255,255,255,0.12)" }}>
            <Zap size={16} color={flashOn ? "#FFD84D" : "white"} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <RefreshCw size={16} color="white" />
          </motion.button>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative mx-4 rounded-[28px] overflow-hidden" style={{ background: "#111115" }}>
        {/* Background image simulating viewfinder */}
        <img
          src="https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?w=375&h=500&fit=crop&auto=format"
          alt="viewfinder"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: internalState === "viewfinder" ? 0.7 : internalState === "preview" ? 0.9 : 0.35 }}
        />

        {/* Viewfinder overlay */}
        {internalState === "viewfinder" && (
          <>
            {/* Detection frame */}
            <div className="absolute inset-8 rounded-[20px]" style={{ border: "1px solid rgba(232,183,200,0.4)" }}>
              {/* Corner markers */}
              {[["top-0 left-0", "top", "left"], ["top-0 right-0", "top", "right"], ["bottom-0 left-0", "bottom", "left"], ["bottom-0 right-0", "bottom", "right"]].map(([pos, v, h], i) => (
                <div key={i} className={`absolute ${pos} w-6 h-6`}>
                  <div className={`absolute ${v}-0 ${h}-0 w-6 h-[2px] bg-[#E8B7C8] rounded-full`} />
                  <div className={`absolute ${v}-0 ${h}-0 h-6 w-[2px] bg-[#E8B7C8] rounded-full`} />
                </div>
              ))}
            </div>
            {/* Guide text */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <div className="px-4 py-2 rounded-full" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>将服装置于画面中央</span>
              </div>
            </div>
          </>
        )}

        {/* Analyzing overlay */}
        {internalState === "analyzing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
            {/* Scan line */}
            <div
              className="absolute left-0 right-0 h-[2px]"
              style={{
                top: `${10 + scanY * 0.8}%`,
                background: "linear-gradient(to right, transparent, #E8B7C8, #E8C8D8, #E8B7C8, transparent)",
                boxShadow: "0 0 12px #E8B7C8",
              }}
            />
            {/* AI analysis UI */}
            <div className="px-6 py-4 rounded-2xl text-center" style={{ background: "rgba(20,16,20,0.8)", backdropFilter: "blur(20px)", minWidth: 200 }}>
              <div className="flex justify-center mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-2 border-transparent flex items-center justify-center"
                  style={{ borderTopColor: "#E8B7C8", borderRightColor: "rgba(232,183,200,0.3)" }}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={analysisStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}
                >
                  {analysisSteps[Math.min(analysisStep, analysisSteps.length - 1)]}
                </motion.p>
              </AnimatePresence>
              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {analysisSteps.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= analysisStep ? "#E8B7C8" : "rgba(255,255,255,0.2)" }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Failed state */}
        {internalState === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(232,107,107,0.2)", border: "1.5px solid rgba(232,107,107,0.5)" }}>
              <AlertTriangle size={24} color="#E86B6B" />
            </div>
            <div className="text-center">
              <p style={{ fontSize: 16, fontWeight: 600, color: "white" }}>识别失败</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>请确保服装清晰可见，光线充足</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="px-5 py-4">
        {internalState === "viewfinder" && (
          <div className="flex items-center justify-between">
            <motion.button whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Image size={20} color="white" />
            </motion.button>
            {/* Capture button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleCapture}
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center relative"
              style={{ background: "rgba(255,255,255,0.12)", border: "2.5px solid rgba(255,255,255,0.5)" }}
            >
              <div className="w-[56px] h-[56px] rounded-full" style={{ background: "linear-gradient(145deg, #E8B7C8, #D0A0B8)" }} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18M3 9h18M3 15h18M3 21h18" opacity="0.5"/>
                <circle cx="18" cy="6" r="3" fill="white" stroke="none" />
              </svg>
            </motion.button>
          </div>
        )}

        {internalState === "preview" && (
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onReset}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <RotateCcw size={16} color="white" />
              <span style={{ fontSize: 15, fontWeight: 500, color: "white" }}>重新拍摄</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleAnalyze}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #E8B7C8, #D9A5BB)" }}
            >
              <Check size={16} color="#1F1F24" />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1F24" }}>开始分析</span>
            </motion.button>
          </div>
        )}

        {internalState === "failed" && (
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onReset}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span style={{ fontSize: 15, fontWeight: 500, color: "white" }}>重新拍摄</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onBack}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Home size={16} color="white" />
              <span style={{ fontSize: 15, fontWeight: 500, color: "white" }}>返回首页</span>
            </motion.button>
          </div>
        )}
      </div>
      <div style={{ height: "16px" }} />
    </div>
  );
}
