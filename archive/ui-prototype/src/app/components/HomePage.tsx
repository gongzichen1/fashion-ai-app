import { motion } from "motion/react";
import { Bell, MapPin, Wind, Droplets, Sparkles, Shirt, CloudSun, LayoutGrid, ChevronRight, Camera, ImageIcon } from "lucide-react";

type Page = "home" | "camera" | "result" | "profile" | "style-prefs" | "body-profile" | "feedback" | "about";

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const recentItems = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?w=200&h=260&fit=crop&auto=format",
    name: "米白色过膝半裙",
    tags: ["极简", "休闲"],
    date: "2天前",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=200&h=260&fit=crop&auto=format",
    name: "藏青色西装外套",
    tags: ["通勤", "商务"],
    date: "5天前",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=200&h=260&fit=crop&auto=format",
    name: "浅粉碎花连衣裙",
    tags: ["甜美", "约会"],
    date: "1周前",
  },
];

const styleCards = [
  { name: "通勤风", img: "https://images.unsplash.com/photo-1524548209323-6fb4a0d4a4a3?w=160&h=220&fit=crop&auto=format" },
  { name: "甜美风", img: "https://images.unsplash.com/photo-1520745716611-5f02a256ac09?w=160&h=220&fit=crop&auto=format" },
  { name: "极简风", img: "https://images.unsplash.com/photo-1661099508870-5f959f1e151a?w=160&h=220&fit=crop&auto=format" },
  { name: "轻熟风", img: "https://images.unsplash.com/photo-1762605135012-56a59a059e60?w=160&h=220&fit=crop&auto=format" },
  { name: "休闲风", img: "https://images.unsplash.com/photo-1635866091268-87ca924abc9a?w=160&h=220&fit=crop&auto=format" },
  { name: "运动风", img: "https://images.unsplash.com/photo-1621804174996-eb774edf7880?w=160&h=220&fit=crop&auto=format" },
  { name: "复古风", img: "https://images.unsplash.com/photo-1619264437738-0c22e4d22f27?w=160&h=220&fit=crop&auto=format" },
];

const features = [
  { icon: Sparkles, label: "AI识别", color: "#E8B7C8", bg: "#FBF0F4" },
  { icon: Shirt, label: "搭配推荐", color: "#D7A060", bg: "#FBF4EC" },
  { icon: CloudSun, label: "天气穿搭", color: "#9EB7B2", bg: "#EEF5F4" },
  { icon: LayoutGrid, label: "智能衣橱", color: "#A89ED4", bg: "#F3F0FB" },
];

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start px-5 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            {/* Logo mark */}
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8B7C8, #D7A8BE)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L9 5H12L9.5 7.5L10.5 11L7 9L3.5 11L4.5 7.5L2 5H5L7 2Z" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E8B7C8", letterSpacing: "0.5px" }}>智搭</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#1F1F24", letterSpacing: "-0.5px", lineHeight: 1.3 }}>
            早安，今天穿什么？
          </p>
          <p style={{ fontSize: 13, color: "#9B9BA8", marginTop: 2 }}>为你准备了今日专属搭配灵感</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: "#FFF", boxShadow: "0 2px 8px rgba(31,31,36,0.06)" }}>
          <Bell size={18} color="#1F1F24" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E8B7C8]" />
        </button>
      </div>

      {/* Weather Card */}
      <div className="mx-5 mt-2 rounded-[18px] overflow-hidden" style={{ background: "linear-gradient(135deg, #EDD8E4 0%, #E4CDD9 40%, #D9CCBF 100%)" }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <MapPin size={12} color="#6B5060" />
                <span style={{ fontSize: 12, color: "#6B5060" }}>北京市朝阳区</span>
              </div>
              <div className="flex items-end gap-2">
                <span style={{ fontSize: 42, fontWeight: 700, color: "#1F1F24", letterSpacing: "-2px", fontFamily: "Inter, system-ui" }}>22°</span>
                <div className="pb-2">
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#3D2E35" }}>晴间多云</p>
                  <p style={{ fontSize: 11, color: "#6B5060" }}>最高 25° · 最低 16°</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {/* Weather icon */}
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="28" r="14" fill="#F5D567" opacity="0.9" />
                {[0,45,90,135,180,225,270,315].map((deg, i) => (
                  <line key={i} x1={30 + Math.cos(deg*Math.PI/180)*17} y1={28 + Math.sin(deg*Math.PI/180)*17} x2={30 + Math.cos(deg*Math.PI/180)*20} y2={28 + Math.sin(deg*Math.PI/180)*20} stroke="#F5D567" strokeWidth="2" strokeLinecap="round" />
                ))}
                <ellipse cx="36" cy="36" rx="10" ry="7" fill="white" opacity="0.85" />
                <ellipse cx="28" cy="38" rx="13" ry="7" fill="white" opacity="0.9" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Wind size={11} color="#6B5060" />
              <span style={{ fontSize: 11, color: "#6B5060" }}>微风 3级</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={11} color="#6B5060" />
              <span style={{ fontSize: 11, color: "#6B5060" }}>湿度 45%</span>
            </div>
          </div>
          {/* AI suggestion */}
          <div className="mt-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.5)" }}>
            <div className="flex items-start gap-1.5">
              <Sparkles size={12} color="#C890A8" style={{ marginTop: 1.5 }} />
              <p style={{ fontSize: 12, color: "#3D2E35", lineHeight: 1.5 }}>
                今天适合 <span style={{ fontWeight: 600 }}>轻薄针织衫</span> + <span style={{ fontWeight: 600 }}>直筒裤</span>，气温舒适，微风宜人
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="px-5 mt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate("camera")}
          className="w-full rounded-[20px] flex items-center justify-between px-5 py-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #E8B7C8 0%, #D9A5BB 100%)", boxShadow: "0 8px 24px rgba(232,183,200,0.4)" }}
        >
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24", letterSpacing: "-0.3px" }}>拍照识衣</p>
            <p style={{ fontSize: 12, color: "rgba(31,31,36,0.6)", marginTop: 2 }}>AI智能识别 · 一键生成搭配方案</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.3)" }}>
            <Camera size={24} color="#1F1F24" />
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="absolute -right-8 bottom-0 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-[20px] flex items-center justify-center gap-2 mt-2.5 py-3.5"
          style={{ background: "#FFFFFF", border: "1px solid rgba(232,183,200,0.5)" }}
        >
          <ImageIcon size={18} color="#C890A8" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#1F1F24" }}>从相册上传</span>
        </motion.button>
      </div>

      {/* Feature Grid */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-4 gap-3">
          {features.map((f, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.94 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: f.bg }}>
                <f.icon size={22} color={f.color} />
              </div>
              <span style={{ fontSize: 11, color: "#5A5A67", fontWeight: 500 }}>{f.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Analysis */}
      <div className="mt-6">
        <div className="flex justify-between items-center px-5 mb-3">
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1F1F24" }}>最近分析</span>
          <button className="flex items-center gap-0.5">
            <span style={{ fontSize: 12, color: "#C890A8" }}>查看全部</span>
            <ChevronRight size={14} color="#C890A8" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
          {recentItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate("result")}
              className="flex-shrink-0 rounded-[18px] overflow-hidden bg-white"
              style={{ width: 120, boxShadow: "0 2px 12px rgba(31,31,36,0.06)" }}
            >
              <div className="relative" style={{ height: 140, background: "#F0EDE8" }}>
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {item.tags.map((tag, ti) => (
                    <span key={ti} className="px-1.5 py-0.5 rounded-md" style={{ fontSize: 9, background: "rgba(232,183,200,0.85)", color: "#3D2030", backdropFilter: "blur(4px)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-2.5 py-2">
                <p style={{ fontSize: 11, fontWeight: 500, color: "#1F1F24" }}>{item.name}</p>
                <p style={{ fontSize: 10, color: "#9B9BA8", marginTop: 1 }}>{item.date}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Popular Styles */}
      <div className="mt-6">
        <div className="flex justify-between items-center px-5 mb-3">
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1F1F24" }}>热门风格</span>
          <button className="flex items-center gap-0.5">
            <span style={{ fontSize: 12, color: "#C890A8" }}>更多</span>
            <ChevronRight size={14} color="#C890A8" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
          {styleCards.map((s, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.96 }}
              className="flex-shrink-0 rounded-[18px] overflow-hidden relative"
              style={{ width: 110, height: 150 }}
            >
              <img
                src={s.img}
                alt={s.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(31,31,36,0.55) 0%, transparent 60%)" }}
              />
              <span
                className="absolute bottom-2.5 left-0 right-0 text-center"
                style={{ fontSize: 12, fontWeight: 600, color: "white", letterSpacing: "0.3px" }}
              >
                {s.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
