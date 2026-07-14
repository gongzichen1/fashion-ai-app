import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Check } from "lucide-react";

interface BodyProfilePageProps {
  onBack: () => void;
}

const bodyShapes = [
  {
    id: "apple",
    label: "苹果型",
    desc: "腰部丰满，肩宽臀窄",
    svg: (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <ellipse cx="16" cy="16" rx="12" ry="12" fill="currentColor" opacity="0.9" />
        <path d="M4 36 Q16 28 28 36 L28 48 Q16 44 4 48Z" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "pear",
    label: "梨型",
    desc: "肩窄臀宽，下身丰满",
    svg: (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <ellipse cx="16" cy="12" rx="8" ry="8" fill="currentColor" opacity="0.9" />
        <ellipse cx="16" cy="34" rx="13" ry="13" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "rectangle",
    label: "直筒型",
    desc: "肩宽腰宽臀宽相近",
    svg: (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <ellipse cx="16" cy="10" rx="8" ry="8" fill="currentColor" opacity="0.9" />
        <rect x="5" y="20" width="22" height="26" rx="4" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "hourglass",
    label: "沙漏型",
    desc: "腰部纤细，肩臀均匀",
    svg: (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <ellipse cx="16" cy="10" rx="12" ry="8" fill="currentColor" opacity="0.9" />
        <path d="M4 18 Q16 26 28 18 Q28 28 16 30 Q4 28 4 18Z" fill="currentColor" opacity="0.5" />
        <ellipse cx="16" cy="38" rx="12" ry="8" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "triangle",
    label: "倒三角",
    desc: "肩宽臀窄，上身丰满",
    svg: (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
        <ellipse cx="16" cy="10" rx="8" ry="8" fill="currentColor" opacity="0.9" />
        <path d="M3 20 L16 48 L29 20 Q22 24 16 24 Q10 24 3 20Z" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
];

export function BodyProfilePage({ onBack }: BodyProfilePageProps) {
  const [height, setHeight] = useState("163");
  const [weight, setWeight] = useState("52");
  const [selected, setSelected] = useState("hourglass");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 1200);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 pt-3 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <ChevronLeft size={22} color="#1F1F24" />
        </motion.button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24" }}>体型档案</p>
          <p style={{ fontSize: 12, color: "#9B9BA8" }}>精准推荐更适合你的穿搭</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Height & Weight */}
        <div className="bg-white rounded-[18px] p-4" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24", marginBottom: 12 }}>基础数据</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "身高", value: height, unit: "cm", setter: setHeight, placeholder: "如：163" },
              { label: "体重", value: weight, unit: "kg", setter: setWeight, placeholder: "如：52" },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ fontSize: 12, color: "#9B9BA8", display: "block", marginBottom: 6 }}>{field.label}</label>
                <div className="flex items-center gap-1 rounded-xl px-3 py-2.5" style={{ background: "#F0EDE8" }}>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontSize: 16, fontWeight: 600, color: "#1F1F24", fontFamily: "Inter, system-ui", width: "60px" }}
                  />
                  <span style={{ fontSize: 12, color: "#9B9BA8" }}>{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {height && weight && (
            <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: "#FBF0F4" }}>
              <p style={{ fontSize: 12, color: "#C070A0" }}>
                BMI：<span style={{ fontWeight: 600 }}>{(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}</span>
                <span style={{ color: "#9B9BA8" }}> · 体重标准范围内</span>
              </p>
            </div>
          )}
        </div>

        {/* Body shape */}
        <div className="bg-white rounded-[18px] p-4" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24", marginBottom: 3 }}>体型特征</p>
          <p style={{ fontSize: 12, color: "#9B9BA8", marginBottom: 12 }}>选择最接近你体型的选项</p>
          <div className="grid grid-cols-3 gap-2.5">
            {bodyShapes.slice(0, 3).map((shape) => (
              <motion.button
                key={shape.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelected(shape.id)}
                className="py-3.5 px-2 rounded-2xl flex flex-col items-center gap-2 relative"
                style={{
                  background: selected === shape.id ? "#FBF0F4" : "#F8F6F2",
                  border: selected === shape.id ? "1.5px solid #E8B7C8" : "1.5px solid transparent",
                }}
              >
                {selected === shape.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#E8B7C8" }}>
                    <Check size={9} color="#1F1F24" />
                  </div>
                )}
                <div style={{ color: selected === shape.id ? "#C890A8" : "#B0B0BC" }}>{shape.svg}</div>
                <div className="text-center">
                  <p style={{ fontSize: 12, fontWeight: 600, color: selected === shape.id ? "#C890A8" : "#1F1F24" }}>{shape.label}</p>
                  <p style={{ fontSize: 9, color: "#9B9BA8", marginTop: 1, lineHeight: 1.3 }}>{shape.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            {bodyShapes.slice(3).map((shape) => (
              <motion.button
                key={shape.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelected(shape.id)}
                className="py-3.5 px-3 rounded-2xl flex items-center gap-3 relative"
                style={{
                  background: selected === shape.id ? "#FBF0F4" : "#F8F6F2",
                  border: selected === shape.id ? "1.5px solid #E8B7C8" : "1.5px solid transparent",
                }}
              >
                {selected === shape.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#E8B7C8" }}>
                    <Check size={9} color="#1F1F24" />
                  </div>
                )}
                <div style={{ color: selected === shape.id ? "#C890A8" : "#B0B0BC" }}>{shape.svg}</div>
                <div className="text-left">
                  <p style={{ fontSize: 12, fontWeight: 600, color: selected === shape.id ? "#C890A8" : "#1F1F24" }}>{shape.label}</p>
                  <p style={{ fontSize: 9, color: "#9B9BA8", marginTop: 1, lineHeight: 1.3 }}>{shape.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{
            background: saved ? "#4CAF8F" : "linear-gradient(135deg, #E8B7C8, #D9A5BB)",
            boxShadow: saved ? "0 6px 20px rgba(76,175,143,0.3)" : "0 6px 20px rgba(232,183,200,0.35)",
            transition: "background 0.3s",
          }}
        >
          {saved && <Check size={18} color="white" />}
          <span style={{ fontSize: 16, fontWeight: 600, color: saved ? "white" : "#1F1F24" }}>
            {saved ? "已保存" : "保存档案"}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
