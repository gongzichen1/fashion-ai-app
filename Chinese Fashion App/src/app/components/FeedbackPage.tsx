import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ImagePlus, X, Send, CheckCircle } from "lucide-react";

interface FeedbackPageProps {
  onBack: () => void;
}

export function FeedbackPage({ onBack }: FeedbackPageProps) {
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onBack(); }, 2200);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#F8F6F2] min-h-full pb-6" style={{ fontFamily: "system-ui, -apple-system, Inter, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 pt-3 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <ChevronLeft size={22} color="#1F1F24" />
        </motion.button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#1F1F24" }}>反馈建议</p>
          <p style={{ fontSize: 12, color: "#9B9BA8" }}>你的反馈帮助智搭变得更好</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center"
            style={{ height: 400 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #4CAF8F20, #4CAF8F10)", border: "2px solid #4CAF8F" }}
            >
              <CheckCircle size={36} color="#4CAF8F" />
            </motion.div>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#1F1F24" }}>感谢反馈！</p>
            <p style={{ fontSize: 13, color: "#9B9BA8", marginTop: 6, textAlign: "center", maxWidth: 220 }}>
              我们会认真阅读每一条建议，持续优化智搭体验
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" className="px-5 space-y-4">
            {/* Feedback content */}
            <div className="bg-white rounded-[18px] p-4" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24", display: "block", marginBottom: 8 }}>
                反馈内容 <span style={{ color: "#E86B6B" }}>*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请描述你遇到的问题或建议，例如：AI识别准确率、搭配推荐效果、界面体验等..."
                className="w-full outline-none resize-none bg-transparent"
                style={{
                  fontSize: 13,
                  color: "#1F1F24",
                  lineHeight: 1.7,
                  minHeight: 120,
                  fontFamily: "system-ui, -apple-system",
                }}
                rows={5}
              />
              <div className="flex justify-end">
                <span style={{ fontSize: 11, color: content.length > 200 ? "#E86B6B" : "#C0C0CC" }}>
                  {content.length}/500
                </span>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24", display: "block", marginBottom: 8 }}>
                上传截图 <span style={{ fontSize: 11, color: "#9B9BA8", fontWeight: 400 }}>（可选）</span>
              </label>
              {attachedImage ? (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden" style={{ border: "1px solid #E6E7EA" }}>
                  <img src={attachedImage} alt="附件" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(31,31,36,0.6)" }}
                  >
                    <X size={12} color="white" />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ background: "#FFFFFF", border: "1.5px dashed #D7C3A3" }}
                >
                  <ImagePlus size={22} color="#D7C3A3" />
                  <span style={{ fontSize: 11, color: "#D7C3A3" }}>添加截图</span>
                </motion.button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />
            </div>

            {/* Contact */}
            <div className="bg-white rounded-[18px] p-4" style={{ boxShadow: "0 2px 12px rgba(31,31,36,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1F1F24", display: "block", marginBottom: 8 }}>
                联系方式 <span style={{ fontSize: 11, color: "#9B9BA8", fontWeight: 400 }}>（方便回复你）</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="手机号 / 微信号 / 邮箱"
                className="w-full outline-none bg-transparent"
                style={{ fontSize: 14, color: "#1F1F24", fontFamily: "system-ui, -apple-system" }}
              />
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              style={{
                background: content.trim() ? "linear-gradient(135deg, #E8B7C8, #D9A5BB)" : "#E6E7EA",
                boxShadow: content.trim() ? "0 6px 20px rgba(232,183,200,0.35)" : "none",
                transition: "background 0.2s",
              }}
            >
              <Send size={16} color={content.trim() ? "#1F1F24" : "#9B9BA8"} />
              <span style={{ fontSize: 15, fontWeight: 600, color: content.trim() ? "#1F1F24" : "#9B9BA8" }}>
                提交反馈
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
