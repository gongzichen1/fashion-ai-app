import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Heart, Clock, Shirt, Settings, Star, LogOut, Camera } from "lucide-react";

type Page = "home" | "camera" | "result" | "profile" | "style-prefs" | "body-profile" | "feedback" | "about";

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
}

const historyItems = [
  { id: 1, img: "https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?w=160&h=160&fit=crop", date: "2026-06-01", tags: ["极简", "通勤"], style: "极简风" },
  { id: 2, img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=160&h=160&fit=crop", date: "2026-05-28", tags: ["商务", "通勤"], style: "商务风" },
  { id: 3, img: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=160&h=160&fit=crop", date: "2026-05-22", tags: ["甜美", "休闲"], style: "甜美风" },
  { id: 4, img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=160&h=160&fit=crop", date: "2026-05-18", tags: ["法式", "轻熟"], style: "法式风" },
];

const favoriteItems = [
  { id: 1, img: "https://images.unsplash.com/photo-1762605135012-56a59a059e60?w=160&h=200&fit=crop", style: "轻熟风", items: 5 },
  { id: 2, img: "https://images.unsplash.com/photo-1524548209323-6fb4a0d4a4a3?w=160&h=200&fit=crop", style: "通勤风", items: 4 },
  { id: 3, img: "https://images.unsplash.com/photo-1661099508870-5f959f1e151a?w=160&h=200&fit=crop", style: "极简风", items: 6 },
];

const closetItems = [
  { id: 1, img: "https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?w=120&h=140&fit=crop", category: "上装", color: "米白", brand: "基础款" },
  { id: 2, img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=120&h=140&fit=crop", category: "外套", color: "藏青", brand: "商务款" },
  { id: 3, img: "https://images.unsplash.com/photo-1453486030486-0a5ffcd82cd9?w=120&h=140&fit=crop", category: "上装", color: "多色", brand: "休闲款" },
  { id: 4, img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=120&h=140&fit=crop", category: "衬衫", color: "彩色", brand: "法式款" },
  { id: 5, img: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=120&h=140&fit=crop", category: "套装", color: "暖色", brand: "通勤款" },
  { id: 6, img: "https://images.unsplash.com/photo-1635866091268-87ca924abc9a?w=120&h=140&fit=crop", category: "配件", color: "驼色", brand: "轻奢款" },
];

const settingLinks: { icon: any; label: string; page: Page; badge?: string }[] = [
  { icon: Star, label: "风格偏好", page: "style-prefs", badge: "已设置" },
  { icon: Camera, label: "体型档案", page: "body-profile" },
  { icon: Settings, label: "反馈建议", page: "feedback" },
  { icon: LogOut, label: "关于智搭", page: "about" },
];

type TabId = "history" | "favorites" | "closet";
const tabs: { id: TabId; label: string }[] = [
  { id: "history", label: "历史记录" },
  { id: "favorites", label: "我的收藏" },
  { id: "closet", label: "我的衣橱" },
];

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("history");

  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      {/* Header */}
      <div
        className="px-5 pt-5 pb-5"
        style={{ background: "linear-gradient(160deg, #EDD8E4 0%, #E8E2DC 100%)" }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(232,183,200,0.3)" }}>
              <img
                src="https://images.unsplash.com/photo-1619264437738-0c22e4d22f27?w=128&h=128&fit=crop&auto=format"
                alt="头像"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#4CAF8F] flex items-center justify-center border-2 border-white">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24" }}>陈小悦</p>
              <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: "linear-gradient(135deg, #E8B7C8, #D7A8BE)", color: "#1F1F24", fontWeight: 600 }}>
                会员
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#6B5060", marginTop: 2 }}>小红书风尚达人 · 品位生活家</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)" }}>
            <Settings size={15} color="#5A4050" />
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { value: "23", label: "分析记录" },
            { value: "18", label: "收藏搭配" },
            { value: "47", label: "衣橱单品" },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#1F1F24", fontFamily: "Inter, system-ui", letterSpacing: "-0.5px" }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: "#6B5060", marginTop: 1 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex rounded-2xl p-1" style={{ background: "#EEEBE6" }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === tab.id ? "#FFFFFF" : "transparent",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(31,31,36,0.08)" : "none",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? "#1F1F24" : "#9B9BA8" }}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="mt-4 px-5"
        >
          {activeTab === "history" && (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate("result")}
                  className="w-full bg-white rounded-[18px] flex overflow-hidden"
                  style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}
                >
                  <div className="w-20 h-20 flex-shrink-0" style={{ background: "#F0EDE8" }}>
                    <img src={item.img} alt={item.style} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 px-3 py-3 text-left">
                    <div className="flex items-start justify-between">
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24" }}>{item.style}</p>
                        <p style={{ fontSize: 11, color: "#9B9BA8", marginTop: 1 }}>{item.date}</p>
                      </div>
                      <ChevronRight size={16} color="#C0C0CC" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag, ti) => (
                        <span key={ti} className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: "#FBF0F4", color: "#C070A0" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="grid grid-cols-2 gap-3">
              {favoriteItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate("result")}
                  className="rounded-[18px] overflow-hidden relative bg-white"
                  style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.06)" }}
                >
                  <div style={{ height: 160, background: "#F0EDE8" }}>
                    <img src={item.img} alt={item.style} className="w-full h-full object-cover" />
                  </div>
                  <div
                    className="absolute inset-x-0 bottom-0 px-3 py-3"
                    style={{ background: "linear-gradient(to top, rgba(31,31,36,0.6) 0%, transparent 100%)" }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{item.style}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>{item.items}件单品</p>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <Heart size={16} color="#E8B7C8" fill="#E8B7C8" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {activeTab === "closet" && (
            <div className="grid grid-cols-3 gap-2.5">
              {closetItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-[14px] overflow-hidden bg-white"
                  style={{ boxShadow: "0 2px 8px rgba(31,31,36,0.06)" }}
                >
                  <div style={{ height: 110, background: "#F0EDE8" }}>
                    <img src={item.img} alt={item.category} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2 py-1.5">
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#1F1F24" }}>{item.category}</p>
                    <p style={{ fontSize: 9, color: "#9B9BA8" }}>{item.color}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Settings links */}
      <div className="mx-5 mt-6 bg-white rounded-[18px] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
        {settingLinks.map((link, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(link.page)}
            className="w-full flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: i < settingLinks.length - 1 ? "1px solid rgba(31,31,36,0.05)" : "none" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FBF0F4" }}>
                <link.icon size={16} color="#C890A8" />
              </div>
              <span style={{ fontSize: 14, color: "#1F1F24", fontWeight: 500 }}>{link.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {link.badge && (
                <span style={{ fontSize: 11, color: "#C890A8" }}>{link.badge}</span>
              )}
              <ChevronRight size={16} color="#C0C0CC" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
