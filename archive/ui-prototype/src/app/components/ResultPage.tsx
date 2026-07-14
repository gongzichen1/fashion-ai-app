import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Heart, Share2, Download, RotateCcw, Home, Sparkles, Tag } from "lucide-react";

type Page = "home" | "camera" | "result" | "profile" | "style-prefs" | "body-profile" | "feedback" | "about";

interface ResultPageProps {
  onNavigate: (page: Page) => void;
}

const colorPalette = ["#F5F0E8", "#C4B49A", "#8B7355", "#E8DDD0", "#3D3028"];

const outfitItems = [
  {
    id: 1,
    category: "上装",
    name: "V领薄款针织开衫",
    brand: "基础款",
    color: "燕麦白",
    img: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=200&h=200&fit=crop&auto=format",
    price: "¥198",
  },
  {
    id: 2,
    category: "下装",
    name: "高腰阔腿直筒裤",
    brand: "基础款",
    color: "燕麦色",
    img: "https://images.unsplash.com/photo-1661099508870-5f959f1e151a?w=200&h=200&fit=crop&auto=format",
    price: "¥259",
  },
  {
    id: 3,
    category: "鞋履",
    name: "平底乐福鞋",
    brand: "通勤首选",
    color: "黑色漆皮",
    img: "https://images.unsplash.com/photo-1544441893-675973e31985?w=200&h=200&fit=crop&auto=format",
    price: "¥399",
  },
  {
    id: 4,
    category: "包包",
    name: "帆布托特包",
    brand: "日常实用",
    color: "驼色",
    img: "https://images.unsplash.com/photo-1635866133730-e5817b5680cd?w=200&h=200&fit=crop&auto=format",
    price: "¥328",
  },
  {
    id: 5,
    category: "配饰",
    name: "14K金细链项链",
    brand: "点睛之笔",
    color: "香槟金",
    img: "https://images.unsplash.com/photo-1635866110391-bdfeaaea1a81?w=200&h=200&fit=crop&auto=format",
    price: "¥168",
  },
];

const scenes = ["上班", "约会", "旅行", "日常", "商务", "派对"];
const styleTags = ["极简", "休闲", "通勤", "法式", "知性"];

export function ResultPage({ onNavigate }: ResultPageProps) {
  const [activeScene, setActiveScene] = useState("日常");
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-[#F8F6F2] min-h-full" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      {/* Back bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate("home")} className="flex items-center gap-1">
          <ChevronLeft size={20} color="#1F1F24" />
          <span style={{ fontSize: 15, color: "#1F1F24" }}>返回</span>
        </motion.button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#1F1F24" }}>AI分析结果</span>
        <div className="w-16" />
      </div>

      {/* Clothing image */}
      <div className="mx-5 rounded-[22px] overflow-hidden relative" style={{ height: 260, background: "#EAE7E2" }}>
        <img
          src="https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?w=375&h=300&fit=crop&auto=format"
          alt="分析服装"
          className="w-full h-full object-cover"
        />
        {/* Score badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(248,246,242,0.9)", backdropFilter: "blur(12px)" }}>
          <Sparkles size={12} color="#E8B7C8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1F1F24" }}>搭配指数 92</span>
        </div>
      </div>

      {/* AI Analysis Card */}
      <div className="mx-5 mt-4 bg-white rounded-[18px] px-4 py-4" style={{ boxShadow: "0 2px 16px rgba(31,31,36,0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8B7C8, #D7A8BE)" }}>
            <Sparkles size={12} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1F24" }}>AI识别结果</span>
        </div>
        <div className="grid grid-cols-2 gap-y-3">
          {[
            { label: "服装类型", value: "Oversized 衬衫" },
            { label: "主色调", value: "米白色" },
            { label: "面料材质", value: "100% 精梭棉" },
            { label: "穿搭风格", value: "极简 / 休闲" },
            { label: "适合季节", value: "春 · 秋" },
            { label: "适合场合", value: "日常 / 通勤" },
          ].map((attr, i) => (
            <div key={i}>
              <p style={{ fontSize: 11, color: "#9B9BA8", marginBottom: 2 }}>{attr.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1F1F24" }}>{attr.value}</p>
            </div>
          ))}
        </div>
        {/* Style tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {styleTags.map((tag, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full" style={{ fontSize: 11, background: "#FBF0F4", color: "#C070A0", fontWeight: 500 }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mx-5 mt-3 bg-white rounded-[18px] px-4 py-4" style={{ boxShadow: "0 2px 16px rgba(31,31,36,0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={15} color="#D7C3A3" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24" }}>色彩分析</span>
        </div>
        <div className="flex items-center gap-3">
          {colorPalette.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full" style={{ background: color, boxShadow: "0 2px 8px rgba(31,31,36,0.12)" }} />
              <span style={{ fontSize: 9, color: "#9B9BA8" }}>{color}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Filter */}
      <div className="mt-4">
        <div className="flex justify-between items-center px-5 mb-3">
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1F24" }}>场景搭配</span>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
          {scenes.map((scene) => (
            <motion.button
              key={scene}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveScene(scene)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full transition-all"
              style={{
                background: activeScene === scene ? "#E8B7C8" : "#FFFFFF",
                color: activeScene === scene ? "#1F1F24" : "#6B6B78",
                fontSize: 13,
                fontWeight: activeScene === scene ? 600 : 400,
                border: activeScene === scene ? "1px solid #E8B7C8" : "1px solid #E6E7EA",
              }}
            >
              {scene}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Outfit Recommendations */}
      <div className="mt-4">
        <div className="px-5 mb-3">
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1F24" }}>推荐搭配单品</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
          {outfitItems.map((item) => (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.96 }}
              className="flex-shrink-0 bg-white rounded-[18px] overflow-hidden"
              style={{ width: 130, boxShadow: "0 2px 12px rgba(31,31,36,0.06)" }}
            >
              <div style={{ height: 130, background: "#F0EDE8" }}>
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-2.5 py-2.5">
                <span className="px-1.5 py-0.5 rounded" style={{ fontSize: 9, background: "#FBF0F4", color: "#C070A0" }}>{item.category}</span>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1F1F24", marginTop: 4, lineHeight: 1.3 }}>{item.name}</p>
                <p style={{ fontSize: 10, color: "#9B9BA8", marginTop: 1 }}>{item.color}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#C890A8", marginTop: 4 }}>{item.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="mx-5 mt-4 rounded-[18px] px-4 py-4" style={{ background: "linear-gradient(135deg, #FBF0F4, #F5EEF8)" }}>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #E8B7C8, #D7A8BE)" }}>
            <Sparkles size={12} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24", marginBottom: 4 }}>智搭建议</p>
            <p style={{ fontSize: 12, color: "#3D2E35", lineHeight: 1.7 }}>
              适合搭配<span style={{ fontWeight: 600 }}>米白色阔腿裤</span>与<span style={{ fontWeight: 600 }}>浅口乐福鞋</span>，整体色调保持同色系米白，营造极简高级感。春季通勤场景下，可外搭驼色大衣提升气质层次。
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mx-5 mt-4 mb-4">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: Heart, label: "收藏", action: () => setSaved(!saved), active: saved, color: saved ? "#E8B7C8" : "#6B6B78" },
            { icon: Share2, label: "分享", action: () => {}, active: false, color: "#6B6B78" },
            { icon: Download, label: "保存", action: () => {}, active: false, color: "#6B6B78" },
            { icon: RotateCcw, label: "重新拍", action: () => onNavigate("camera"), active: false, color: "#6B6B78" },
          ].map(({ icon: Icon, label, action, active, color }, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 8px rgba(31,31,36,0.05)" }}
            >
              <Icon size={18} color={color} fill={active ? color : "none"} />
              <span style={{ fontSize: 11, color: active ? color : "#6B6B78" }}>{label}</span>
            </motion.button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate("home")}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2"
          style={{ background: "#1F1F24" }}
        >
          <Home size={16} color="white" />
          <span style={{ fontSize: 15, fontWeight: 600, color: "white" }}>返回首页</span>
        </motion.button>
      </div>
    </div>
  );
}
