import { motion } from "motion/react";
import { ChevronLeft, Sparkles, Shield, Eye, Cpu, Zap, Heart } from "lucide-react";

interface AboutPageProps {
  onBack: () => void;
}

const features = [
  { icon: Cpu, title: "AI视觉识别", desc: "基于多模态大模型，精准识别服装类型、颜色、面料及风格特征" },
  { icon: Zap, title: "智能搭配引擎", desc: "结合天气、场景、体型及个人偏好，实时生成专属搭配方案" },
  { icon: Eye, title: "风格趋势分析", desc: "持续追踪小红书、Instagram等平台时尚趋势，保持搭配时效性" },
  { icon: Heart, title: "个性化学习", desc: "通过收藏与反馈不断学习你的审美偏好，推荐越来越懂你" },
];

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 pt-3 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <ChevronLeft size={22} color="#1F1F24" />
        </motion.button>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24" }}>关于智搭</p>
      </div>

      {/* Brand hero */}
      <div
        className="mx-5 rounded-[24px] overflow-hidden relative"
        style={{
          background: "linear-gradient(160deg, #EDD8E4 0%, #E4CDD9 40%, #D9CCBF 100%)",
          padding: "32px 24px",
        }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(232,183,200,0.3)" }}
          >
            <div className="flex flex-col items-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                {/* Hanger shape */}
                <path d="M18 6C15.8 6 14 7.8 14 10C14 11.5 14.8 12.8 16 13.5V14H10C7 14 5 16 5 19C5 22 7 24 10 24H26C29 24 31 22 31 19C31 16 29 14 26 14H20V13.5C21.2 12.8 22 11.5 22 10C22 7.8 20.2 6 18 6Z" fill="#C890A8" />
                <path d="M18 6C18 4.9 17.1 4 16 4C14.9 4 14 4.9 14 6" stroke="#C890A8" strokeWidth="1.5" strokeLinecap="round" />
                {/* Sparkles */}
                <path d="M28 8L29 10L31 11L29 12L28 14L27 12L25 11L27 10Z" fill="#D7C3A3" />
                <path d="M6 5L7 7L9 7L7 8L6 10L5 8L3 7L5 7Z" fill="#D7C3A3" />
              </svg>
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#1F1F24", letterSpacing: "-0.5px" }}>智搭</p>
          <p style={{ fontSize: 13, color: "#6B5060", marginTop: 4 }}>StyleMind AI · 你的AI穿搭顾问</p>
          <p style={{ fontSize: 11, color: "#9B7080", marginTop: 8, lineHeight: 1.6, maxWidth: 240 }}>
            让每一天的穿搭成为表达自我的艺术，<br />让AI成为你最懂你的时尚伙伴。
          </p>
          <div className="mt-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }}>
            <span style={{ fontSize: 11, color: "#6B5060" }}>版本 2.6.0 · 2026年6月最新</span>
          </div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="mx-5 mt-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1F1F24", marginBottom: 12 }}>核心能力</p>
        <div className="space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-[18px] px-4 py-3.5 flex items-start gap-3"
              style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FBF0F4" }}>
                <f.icon size={17} color="#C890A8" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24" }}>{f.title}</p>
                <p style={{ fontSize: 11, color: "#6B6B78", marginTop: 2, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="mx-5 mt-5 bg-white rounded-[18px] px-4 py-4" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} color="#9EB7B2" />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24" }}>隐私承诺</p>
        </div>
        <p style={{ fontSize: 12, color: "#6B6B78", lineHeight: 1.7 }}>
          你上传的所有服装图片仅用于AI识别分析，不会存储于云端服务器。智搭严格遵守《个人信息保护法》，所有数据处理均在本地完成，我们承诺永不将你的穿搭数据用于商业目的。
        </p>
      </div>

      {/* Bottom links */}
      <div className="mx-5 mt-4 bg-white rounded-[18px] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
        {[
          { label: "用户协议" },
          { label: "隐私政策" },
          { label: "联系我们" },
        ].map((link, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: i < 2 ? "1px solid rgba(31,31,36,0.05)" : "none" }}
          >
            <span style={{ fontSize: 14, color: "#1F1F24" }}>{link.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0CC" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </motion.button>
        ))}
      </div>

      <p className="text-center mt-6" style={{ fontSize: 11, color: "#C0C0CC" }}>
        Made with ♥ by 智搭团队 · © 2026
      </p>
    </div>
  );
}
