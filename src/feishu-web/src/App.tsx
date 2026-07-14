import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Check, ChevronRight, CircleAlert, CloudSun, Heart, History,
  Home, ImagePlus, LayoutGrid, LoaderCircle, LogOut, RefreshCw, Share2, Shirt,
  Sparkles, Star, Trash2, Upload, UserRound, WandSparkles, X,
} from "lucide-react";
import { ApiError, api, assetUrl } from "./api";
import { chooseImage, configureJsapi, isFeishu, requestLoginCode, shareResult } from "./feishu";
import type { Analysis, Preferences, User, WardrobeItem } from "./types";

type Page = "home" | "upload" | "result" | "history" | "favorites" | "wardrobe" | "preferences" | "profile";
type Notice = { tone: "success" | "error" | "info"; text: string } | null;
const defaultPreferences: Preferences = { styles: ["极简", "通勤"], scenarios: ["上班", "日常"], budget: "¥500–1000" };

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.requestId) return `${error.message}（请求 ${error.requestId}）`;
  return error instanceof Error ? error.message : "操作失败，请稍后重试";
}

function displayName(user: User): string {
  return user.display_name || user.name || "智搭用户";
}

function analysisImage(item: Analysis): string {
  return assetUrl(item.image_url || item.image);
}

function garmentName(item: Analysis): string {
  return item.garmentType || item.garment_type || item.category || "服装分析";
}

function dateText(value?: string): string {
  if (!value) return "刚刚";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function Empty({ icon: Icon, title, detail, action }: { icon: typeof Shirt; title: string; detail: string; action?: () => void }) {
  return <div className="empty"><span className="empty-icon"><Icon size={25} /></span><h3>{title}</h3><p>{detail}</p>{action && <button className="text-button" onClick={action}>去拍照识衣 <ChevronRight size={15} /></button>}</div>;
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  return <div className={`notice ${notice.tone}`}>{notice.tone === "error" ? <CircleAlert size={17} /> : <Check size={17} />}<span>{notice.text}</span><button aria-label="关闭提示" onClick={onClose}><X size={15} /></button></div>;
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: (user: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const insideFeishu = isFeishu();
  const allowDevLogin = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === "true";

  const login = async () => {
    setLoading(true); setError("");
    try {
      const user = insideFeishu ? await api.loginWithFeishu(await requestLoginCode()) : await api.devLogin();
      onLoggedIn(user);
    } catch (reason) { setError(errorText(reason)); } finally { setLoading(false); }
  };

  useEffect(() => { if (insideFeishu) void login(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <main className="login-shell">
    <div className="login-card">
      <div className="brand-mark"><WandSparkles size={28} /></div>
      <span className="eyebrow">智搭 · StyleMind AI</span>
      <h1>懂你的智能穿搭助手</h1>
      <p>拍下衣服，AI 为你识别款式、颜色与材质，并给出适合场景的搭配灵感。</p>
      {!insideFeishu && <div className="browser-hint"><CircleAlert size={18} /><div><b>当前不在飞书客户端</b><span>{allowDevLogin ? "当前构建允许开发体验登录。" : "请从飞书工作台打开正式应用。"}</span></div></div>}
      {error && <div className="inline-error"><CircleAlert size={16} />{error}</div>}
      {(insideFeishu || allowDevLogin) && <button className="primary-button" onClick={login} disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={18} /> : insideFeishu ? <Sparkles size={18} /> : <UserRound size={18} />}
        {loading ? "正在安全登录…" : insideFeishu ? "重新登录" : "开发环境体验登录"}
      </button>}
      <small>登录即表示你同意仅将上传图片用于本次服装分析。</small>
    </div>
  </main>;
}

function Header({ title, subtitle, back }: { title: string; subtitle?: string; back?: () => void }) {
  return <header className="page-header">{back && <button className="icon-button" aria-label="返回" onClick={back}><ArrowLeft size={20} /></button>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></header>;
}

function HomePage({ user, recent, go, beginPick, openResult }: { user: User; recent: Analysis[]; go: (page: Page) => void; beginPick: (source: "camera" | "album") => void; openResult: (item: Analysis) => void }) {
  const firstName = displayName(user).slice(0, 6);
  return <div className="page home-page">
    <section className="home-heading"><div><span className="eyebrow">智搭 · STYLEMIND AI</span><h1>你好，{firstName}<br />今天穿什么？</h1><p>从一件衣服开始，找到今天的搭配灵感。</p></div><div className="mini-avatar">{firstName.slice(0, 1)}</div></section>
    <section className="weather-card"><div><span><CloudSun size={14} /> 今日穿搭建议</span><h2>轻松叠穿，自在出门</h2><p>根据天气变化灵活增减外套，优先选择透气、舒适的面料。</p></div><Sparkles className="weather-spark" size={56} /></section>
    <section className="capture-card"><div><span className="capture-icon"><Camera size={25} /></span><div><h2>拍照识衣</h2><p>AI 识别服装特征，生成专属搭配方案</p></div></div><button className="dark-button" onClick={() => beginPick("camera")}><Camera size={17} />立即拍摄</button><button className="soft-button" onClick={() => beginPick("album")}><ImagePlus size={17} />从相册选择</button></section>
    <section className="shortcut-grid">
      <button onClick={() => go("history")}><History /><b>分析历史</b><span>回看每次灵感</span></button>
      <button onClick={() => go("favorites")}><Heart /><b>我的收藏</b><span>保存心动搭配</span></button>
      <button onClick={() => go("wardrobe")}><LayoutGrid /><b>智能衣橱</b><span>管理真实单品</span></button>
      <button onClick={() => go("preferences")}><Star /><b>风格偏好</b><span>让推荐更懂你</span></button>
    </section>
    <section className="section-block"><div className="section-title"><h2>最近分析</h2><button onClick={() => go("history")}>查看全部 <ChevronRight size={15} /></button></div>{recent.length ? <div className="horizontal-list">{recent.slice(0, 5).map((item) => <button className="recent-card" key={item.id} onClick={() => openResult(item)}><div className="image-wrap">{analysisImage(item) ? <img src={analysisImage(item)} alt={garmentName(item)} /> : <Shirt />}</div><b>{garmentName(item)}</b><span>{dateText(item.created_at || item.createdAt)}</span></button>)}</div> : <p className="quiet-row">完成第一次分析后，结果会出现在这里。</p>}</section>
  </div>;
}

function UploadPage({ preview, busy, onPick, onAnalyze, goHome }: { preview: string; busy: boolean; onPick: (source: "camera" | "album") => void; onAnalyze: () => void; goHome: () => void }) {
  return <div className="page"><Header title="拍照识衣" subtitle="请让单件服装完整、清晰地出现在画面中" back={goHome} />
    <section className={`upload-stage ${preview ? "has-image" : ""}`}>{preview ? <img src={preview} alt="待分析服装预览" /> : <><span><Camera size={38} /></span><h2>拍摄或选择一张服装照片</h2><p>推荐正面拍摄 · 光线均匀 · 背景简洁</p></>}</section>
    <div className="upload-actions"><button className="soft-button" onClick={() => onPick("camera")} disabled={busy}><Camera size={18} />拍摄照片</button><button className="soft-button" onClick={() => onPick("album")} disabled={busy}><ImagePlus size={18} />选择图片</button></div>
    <button className="primary-button" disabled={!preview || busy} onClick={onAnalyze}>{busy ? <><LoaderCircle className="spin" size={18} />AI 正在分析，请稍候…</> : <><Sparkles size={18} />开始 AI 分析</>}</button>
    <div className="privacy-note"><CircleAlert size={15} />原始图片默认仅用于分析；正式环境将按服务端保留策略自动清理。</div>
  </div>;
}

function ResultPage({ item, favorite, onFavorite, onWardrobe, onShare, retake, back }: { item: Analysis; favorite: boolean; onFavorite: () => void; onWardrobe: () => void; onShare: () => void; retake: () => void; back: () => void }) {
  const styles = item.styles || [];
  const scenes = item.scenes || item.suitable_scenes || [];
  const seasons = item.seasons || item.suitable_seasons || [];
  const attributes = [
    ["服装类型", garmentName(item)], ["主色调", item.colorName || item.color_name || "待识别"], ["面料材质", item.material || "待识别"],
    ["图案", item.pattern || "无明显图案"], ["适合季节", seasons.join(" · ") || "四季"], ["适合场景", scenes.join(" / ") || "日常"],
  ];
  return <div className="page result-page"><Header title="AI 分析结果" subtitle="推荐仅作为穿搭灵感参考" back={back} />
    <section className="result-hero">{analysisImage(item) ? <img src={analysisImage(item)} alt={garmentName(item)} /> : <Shirt size={48} />}<span><Sparkles size={14} /> 分析完成</span></section>
    <section className="white-card"><div className="card-heading"><span className="small-brand"><Sparkles size={14} /></span><h2>服装特征</h2></div><div className="attribute-grid">{attributes.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>{styles.length > 0 && <div className="tag-row">{styles.map((style) => <span key={style}>{style}</span>)}</div>}</section>
    {(item.description || item.styleTips || item.overallStyle) && <section className="advice-card"><span className="small-brand"><WandSparkles size={14} /></span><div><h2>智搭建议</h2><p>{item.styleTips || item.description || item.overallStyle}</p></div></section>}
    <section className="section-block"><div className="section-title"><h2>推荐搭配单品</h2><span>{item.recommendations?.length || 0} 件</span></div>{item.recommendations?.length ? <div className="recommend-grid">{item.recommendations.map((rec) => <article key={rec.id}><div className="image-wrap">{rec.image ? <img src={assetUrl(rec.image)} alt={rec.name} /> : <Shirt />}</div><span>{rec.type || "搭配"}</span><b>{rec.name}</b><p>{rec.reason || rec.description || rec.color}</p></article>)}</div> : <p className="quiet-row">本次分析暂未返回搭配单品，不展示虚假商品与价格。</p>}</section>
    <div className="result-actions"><button onClick={onFavorite} className={favorite ? "active" : ""}><Heart fill={favorite ? "currentColor" : "none"} />{favorite ? "已收藏" : "收藏"}</button><button onClick={onWardrobe}><LayoutGrid />加入衣橱</button><button onClick={onShare}><Share2 />分享</button><button onClick={retake}><RefreshCw />重新拍</button></div>
  </div>;
}

function ListPage({ title, subtitle, items, empty, onOpen, back, deleting, onDelete }: { title: string; subtitle: string; items: Analysis[]; empty: string; onOpen: (item: Analysis) => void; back: () => void; deleting?: boolean; onDelete?: (item: Analysis) => void }) {
  return <div className="page"><Header title={title} subtitle={subtitle} back={back} />{items.length ? <div className="analysis-list">{items.map((item) => <article key={item.id}><button className="list-main" onClick={() => onOpen(item)}><div className="thumb">{analysisImage(item) ? <img src={analysisImage(item)} alt="" /> : <Shirt />}</div><div><h2>{garmentName(item)}</h2><p>{item.styles?.join(" · ") || item.overallStyle || "AI 穿搭分析"}</p><span>{dateText(item.created_at || item.createdAt)}</span></div><ChevronRight size={18} /></button>{onDelete && <button className="delete-button" disabled={deleting} aria-label="删除" onClick={() => onDelete(item)}><Trash2 size={16} /></button>}</article>)}</div> : <Empty icon={title.includes("收藏") ? Heart : History} title={empty} detail="选择一件衣服完成分析，灵感会安全地保存在你的账号下。" />}</div>;
}

function WardrobePage({ items, remove, back, add }: { items: WardrobeItem[]; remove: (item: WardrobeItem) => void; back: () => void; add: () => void }) {
  return <div className="page"><Header title="我的衣橱" subtitle="只展示你明确加入的真实单品" back={back} />{items.length ? <div className="wardrobe-grid">{items.map((item) => <article key={item.id}><div className="image-wrap">{assetUrl(item.image_url || item.image) ? <img src={assetUrl(item.image_url || item.image)} alt={item.name || item.category} /> : <Shirt />}</div><div><span>{item.category || "单品"}</span><b>{item.name || item.color || "我的衣物"}</b></div><button aria-label="移出衣橱" onClick={() => remove(item)}><Trash2 size={15} /></button></article>)}</div> : <Empty icon={LayoutGrid} title="衣橱还是空的" detail="分析完成后，点击“加入衣橱”即可保存真实单品。" action={add} />}</div>;
}

function PreferencesPage({ initial, save, back, busy }: { initial: Preferences; save: (value: Preferences) => void; back: () => void; busy: boolean }) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const toggle = (key: "styles" | "scenarios", item: string) => setValue((old) => ({ ...old, [key]: old[key].includes(item) ? old[key].filter((x) => x !== item) : [...old[key], item] }));
  return <div className="page"><Header title="风格偏好" subtitle="让每次推荐更贴近你的生活" back={back} /><section className="choice-section"><h2>穿搭风格</h2><div className="chips">{["极简", "通勤", "法式", "甜美", "运动", "轻熟", "街头", "韩系", "复古", "知性"].map((item) => <button key={item} className={value.styles.includes(item) ? "selected" : ""} onClick={() => toggle("styles", item)}>{item}</button>)}</div></section><section className="choice-section"><h2>常用场景</h2><div className="chips gold">{["上班", "约会", "旅行", "聚会", "日常", "健身", "逛街"].map((item) => <button key={item} className={value.scenarios.includes(item) ? "selected" : ""} onClick={() => toggle("scenarios", item)}>{item}</button>)}</div></section><section className="choice-section"><h2>预算区间</h2><div className="budget-grid">{["¥100–500", "¥500–1000", "¥1000–3000", "¥3000+"].map((item) => <button key={item} className={value.budget === item ? "selected" : ""} onClick={() => setValue({ ...value, budget: item })}>{item}{value.budget === item && <Check size={15} />}</button>)}</div></section><button className="primary-button" disabled={busy || !value.styles.length} onClick={() => save(value)}>{busy ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}保存偏好</button></div>;
}

function ProfilePage({ user, counts, go, logout }: { user: User; counts: [number, number, number]; go: (p: Page) => void; logout: () => void }) {
  return <div className="page"><section className="profile-hero"><div className="profile-avatar">{assetUrl(user.avatar_url) ? <img src={assetUrl(user.avatar_url)} alt="头像" /> : displayName(user).slice(0, 1)}</div><div><span>飞书账号</span><h1>{displayName(user)}</h1><p>{user.tenant_name || "企业内部智搭体验"}</p></div></section><div className="stats">{[[counts[0], "分析记录"], [counts[1], "收藏搭配"], [counts[2], "衣橱单品"]].map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div><div className="menu-card">{[[History, "分析历史", "history"], [Heart, "我的收藏", "favorites"], [LayoutGrid, "我的衣橱", "wardrobe"], [Star, "风格偏好", "preferences"]].map(([Icon, label, page]) => { const I = Icon as typeof History; return <button key={label as string} onClick={() => go(page as Page)}><span><I size={18} /></span><b>{label as string}</b><ChevronRight size={17} /></button>; })}</div><div className="account-note"><CircleAlert size={17} /><p>你的分析、收藏与衣橱内容只应对当前飞书账号可见。如发现异常，请立即停止使用并反馈。</p></div><button className="logout-button" onClick={logout}><LogOut size={17} />退出登录</button></div>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [history, setHistory] = useState<Analysis[]>([]);
  const [favorites, setFavorites] = useState<Analysis[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestedSource = useRef<"camera" | "album">("album");

  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([api.history(), api.favorites(), api.wardrobe(), api.preferences()]);
    if (results[0].status === "fulfilled") setHistory(results[0].value);
    if (results[1].status === "fulfilled") setFavorites(results[1].value);
    if (results[2].status === "fulfilled") setWardrobe(results[2].value);
    if (results[3].status === "fulfilled") setPreferences({ ...defaultPreferences, ...results[3].value });
  }, []);

  useEffect(() => { api.me().then((current) => { setUser(current); void loadData(); }).catch(() => undefined).finally(() => setChecking(false)); }, [loadData]);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const loggedIn = (current: User) => { setUser(current); void configureJsapi(); void loadData(); };
  const show = (tone: NonNullable<Notice>["tone"], text: string) => { setNotice({ tone, text }); window.setTimeout(() => setNotice(null), 4500); };
  const pick = async (source: "camera" | "album") => {
    requestedSource.current = source;
    try {
      if (isFeishu()) {
        const selectedFile = await chooseImage(source); setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile)); setPage("upload");
      } else {
        if (fileInput.current) { fileInput.current.accept = "image/jpeg,image/png,image/webp"; fileInput.current.click(); }
      }
    } catch (reason) { show("error", `${errorText(reason)}，可改用本地文件选择。`); fileInput.current?.click(); }
  };
  const fileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) return show("error", "请选择 JPG、PNG 或 WebP 图片");
    if (selectedFile.size > 15 * 1024 * 1024) return show("error", "图片不能超过 15MB");
    setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile)); setPage("upload"); event.target.value = "";
  };
  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    try { const result = await api.analyze(file, preferences); setSelected(result); setHistory((old) => [result, ...old.filter((x) => x.id !== result.id)]); setPage("result"); show("success", "AI 分析完成"); }
    catch (reason) { show("error", errorText(reason)); } finally { setBusy(false); }
  };
  const openResult = async (item: Analysis) => {
    setSelected(item); setPage("result");
    try { setSelected(await api.result(item.id)); } catch { /* list data remains useful */ }
  };
  useEffect(() => {
    if (!user) return;
    void configureJsapi();
    const resultId = new URLSearchParams(location.search).get("result");
    if (!resultId) return;
    api.result(resultId).then((item) => { setSelected(item); setPage("result"); }).catch((reason) => show("error", `无法打开分享结果：${errorText(reason)}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleFavorite = async () => {
    if (!selected) return;
    setBusy(true);
    try { const exists = favorites.some((item) => item.id === selected.id); if (exists) { await api.removeFavorite(selected.id); setFavorites((old) => old.filter((item) => item.id !== selected.id)); } else { await api.addFavorite(selected.id); setFavorites((old) => [selected, ...old]); } show("success", exists ? "已取消收藏" : "已加入收藏"); }
    catch (reason) { show("error", errorText(reason)); } finally { setBusy(false); }
  };
  const addWardrobe = async () => { if (!selected) return; try { const item = await api.addWardrobe(selected.id); setWardrobe((old) => [item, ...old.filter((x) => x.id !== item.id)]); show("success", "已加入我的衣橱"); } catch (reason) { show("error", errorText(reason)); } };
  const doShare = async () => { if (!selected) return; try { const mode = await shareResult(`智搭分析：${garmentName(selected)}`, selected.styleTips || selected.description || "看看我的 AI 穿搭建议", `${location.origin}${location.pathname}?result=${encodeURIComponent(selected.id)}`); show("success", mode === "clipboard" ? "分享链接已复制" : "已打开分享面板"); } catch (reason) { show("error", errorText(reason)); } };

  if (checking) return <div className="splash"><div className="brand-mark"><WandSparkles /></div><LoaderCircle className="spin" /><span>正在进入智搭…</span></div>;
  if (!user) return <LoginScreen onLoggedIn={loggedIn} />;

  const go = (next: Page) => setPage(next);
  const content = page === "home" ? <HomePage user={user} recent={history} go={go} beginPick={pick} openResult={openResult} />
    : page === "upload" ? <UploadPage preview={preview} busy={busy} onPick={pick} onAnalyze={analyze} goHome={() => go("home")} />
    : page === "result" && selected ? <ResultPage item={selected} favorite={favorites.some((x) => x.id === selected.id)} onFavorite={toggleFavorite} onWardrobe={addWardrobe} onShare={doShare} retake={() => { setFile(null); setPreview(""); go("upload"); }} back={() => go("home")} />
    : page === "history" ? <ListPage title="分析历史" subtitle="每一次识别与搭配建议" items={history} empty="还没有分析记录" onOpen={openResult} back={() => go("home")} />
    : page === "favorites" ? <ListPage title="我的收藏" subtitle="留住喜欢的搭配灵感" items={favorites} empty="还没有收藏" onOpen={openResult} back={() => go("home")} onDelete={async (item) => { try { await api.removeFavorite(item.id); setFavorites((old) => old.filter((x) => x.id !== item.id)); show("success", "已取消收藏"); } catch (reason) { show("error", errorText(reason)); } }} />
    : page === "wardrobe" ? <WardrobePage items={wardrobe} back={() => go("home")} add={() => go("upload")} remove={async (item) => { try { await api.removeWardrobe(item.id); setWardrobe((old) => old.filter((x) => x.id !== item.id)); show("success", "已移出衣橱"); } catch (reason) { show("error", errorText(reason)); } }} />
    : page === "preferences" ? <PreferencesPage initial={preferences} busy={busy} back={() => go("profile")} save={async (value) => { setBusy(true); try { setPreferences(await api.savePreferences(value)); show("success", "偏好已保存"); go("profile"); } catch (reason) { show("error", errorText(reason)); } finally { setBusy(false); } }} />
    : <ProfilePage user={user} counts={[history.length, favorites.length, wardrobe.length]} go={go} logout={async () => { try { await api.logout(); } finally { setUser(null); setPage("home"); } }} />;

  return <div className="app-shell"><input ref={fileInput} hidden type="file" capture={requestedSource.current === "camera" ? "environment" : undefined} onChange={fileChanged} /><NoticeBar notice={notice} onClose={() => setNotice(null)} /><main className="app-main">{content}</main>{!["upload", "result", "preferences"].includes(page) && <nav className="bottom-nav"><button className={page === "home" ? "active" : ""} onClick={() => go("home")}><Home /><span>首页</span></button><button className={["history", "favorites"].includes(page) ? "active" : ""} onClick={() => go("history")}><History /><span>记录</span></button><button className="camera-tab" aria-label="拍照识衣" onClick={() => go("upload")}><Camera /></button><button className={page === "wardrobe" ? "active" : ""} onClick={() => go("wardrobe")}><LayoutGrid /><span>衣橱</span></button><button className={page === "profile" ? "active" : ""} onClick={() => go("profile")}><UserRound /><span>我的</span></button></nav>}</div>;
}

export default App;
