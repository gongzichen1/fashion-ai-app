import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Check } from "lucide-react";

interface StylePreferencesPageProps {
  onBack: () => void;
}

const styles = ["极简", "通勤", "法式", "甜美", "运动", "轻熟", "街头", "韩系", "复古", "知性"];
const scenarios = ["上班", "约会", "旅行", "聚会", "日常", "健身", "逛街"];
const budgets = [
  { label: "¥100–500", sub: "入门亲民" },
  { label: "¥500–1000", sub: "日常主力" },
  { label: "¥1000–3000", sub: "品质精选" },
  { label: "¥3000+", sub: "轻奢优选" },
];

export function StylePreferencesPage({ onBack }: StylePreferencesPageProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["极简", "通勤", "法式"]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(["上班", "日常"]);
  const [selectedBudget, setSelectedBudget] = useState("¥500–1000");
  const [saved, setSaved] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 1200);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <ChevronLeft size={22} color="#1F1F24" />
        </motion.button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24" }}>风格偏好</p>
          <p style={{ fontSize: 12, color: "#9B9BA8" }}>告诉AI你的穿搭喜好</p>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Style preferences */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24", marginBottom: 12 }}>穿搭风格</p>
          <div className="flex flex-wrap gap-2.5">
            {styles.map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggle(selectedStyles, setSelectedStyles, s)}
                className="px-4 py-2 rounded-full transition-all"
                style={{
                  background: selectedStyles.includes(s) ? "#E8B7C8" : "#FFFFFF",
                  color: selectedStyles.includes(s) ? "#1F1F24" : "#6B6B78",
                  fontSize: 13,
                  fontWeight: selectedStyles.includes(s) ? 600 : 400,
                  border: selectedStyles.includes(s) ? "1px solid #E8B7C8" : "1px solid #E6E7EA",
                  boxShadow: selectedStyles.includes(s) ? "0 2px 8px rgba(232,183,200,0.3)" : "none",
                }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Scenarios */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24", marginBottom: 12 }}>常用场景</p>
          <div className="flex flex-wrap gap-2.5">
            {scenarios.map((sc) => (
              <motion.button
                key={sc}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggle(selectedScenarios, setSelectedScenarios, sc)}
                className="px-4 py-2 rounded-full transition-all"
                style={{
                  background: selectedScenarios.includes(sc) ? "#D7C3A3" : "#FFFFFF",
                  color: selectedScenarios.includes(sc) ? "#1F1F24" : "#6B6B78",
                  fontSize: 13,
                  fontWeight: selectedScenarios.includes(sc) ? 600 : 400,
                  border: selectedScenarios.includes(sc) ? "1px solid #D7C3A3" : "1px solid #E6E7EA",
                  boxShadow: selectedScenarios.includes(sc) ? "0 2px 8px rgba(215,195,163,0.3)" : "none",
                }}
              >
                {sc}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1F1F24", marginBottom: 12 }}>预算区间</p>
          <div className="grid grid-cols-2 gap-2.5">
            {budgets.map((b) => (
              <motion.button
                key={b.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBudget(b.label)}
                className="py-3.5 px-3 rounded-2xl text-left relative overflow-hidden"
                style={{
                  background: selectedBudget === b.label ? "#1F1F24" : "#FFFFFF",
                  border: selectedBudget === b.label ? "1.5px solid #1F1F24" : "1.5px solid #E6E7EA",
                }}
              >
                {selectedBudget === b.label && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#E8B7C8" }}>
                    <Check size={10} color="#1F1F24" />
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: selectedBudget === b.label ? "white" : "#1F1F24", letterSpacing: "-0.3px", fontFamily: "Inter, system-ui" }}>
                  {b.label}
                </p>
                <p style={{ fontSize: 11, color: selectedBudget === b.label ? "rgba(255,255,255,0.6)" : "#9B9BA8", marginTop: 2 }}>
                  {b.sub}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 mt-2"
          style={{
            background: saved ? "#4CAF8F" : "linear-gradient(135deg, #E8B7C8, #D9A5BB)",
            boxShadow: saved ? "0 6px 20px rgba(76,175,143,0.3)" : "0 6px 20px rgba(232,183,200,0.35)",
            transition: "background 0.3s, box-shadow 0.3s",
          }}
        >
          {saved ? <Check size={18} color="white" /> : null}
          <span style={{ fontSize: 16, fontWeight: 600, color: saved ? "white" : "#1F1F24" }}>
            {saved ? "已保存" : "保存偏好"}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
