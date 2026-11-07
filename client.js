window.__ModuleLoader__.load({
  id: "dsh-plugin-versions",
  factory: (require) => {
    const ReactMod = require("react");
    const React = (ReactMod && ReactMod.createElement) ? ReactMod : ((ReactMod && ReactMod.default && ReactMod.default.createElement) ? ReactMod.default : ReactMod);
    const h = React.createElement;

    const S = {
      root: { display: "flex", flexDirection: "column", gap: "10px", padding: "4px 2px", fontSize: "13px", lineHeight: 1.5, color: "inherit" },
      bar: { display: "flex", alignItems: "center", gap: "8px" },
      muted: { opacity: 0.62 },
      table: { display: "flex", flexDirection: "column", border: "1px solid rgba(128,128,128,0.22)", borderRadius: "8px", overflow: "hidden" },
      row: { display: "grid", gridTemplateColumns: "minmax(180px,1.6fr) 110px 120px minmax(110px,1fr)", gap: "8px", padding: "9px 12px", borderTop: "1px solid rgba(128,128,128,0.16)", alignItems: "center" },
      head: { fontWeight: 600, background: "rgba(128,128,128,0.07)", borderTop: "none" },
      name: { fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      badge: { display: "inline-block", padding: "1px 7px", borderRadius: "999px", fontSize: "12px", border: "1px solid currentColor" },
      upd: { color: "#2f9e63" },
      btn: { font: "inherit", color: "inherit", background: "transparent", border: "1px solid rgba(128,128,128,0.35)", borderRadius: "6px", padding: "2px 9px", cursor: "pointer" },
      err: { color: "#d9534f" },
      click: { cursor: "pointer" }
    };

    function describe(b) {
      if (b.updatable) return "可更新";
      if (!b.installed) return "未安装";
      if (b.official) return "跟随 DSH";
      if (b.optional) return "按需安装";
      return "来源不支持更新";
    }

    function latestText(slot) {
      if (!slot) return "—";
      if (slot.status === "loading") return "检查中…";
      if (slot.status === "error") return "检查失败";
      const list = slot.list;
      if (!list) return "—";
      if (list.status === "refused") return list.problem === "not-updatable" ? "—" : "无法检查";
      const first = list.versions && list.versions[0];
      return first ? first.version : "已是最新";
    }

    class TabBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { err: null };
      }
      static getDerivedStateFromError(err) {
        return { err: err };
      }
      render() {
        if (this.state.err) {
          return h("div", { style: { color: "#d9534f", whiteSpace: "pre-wrap", fontSize: "12px" } }, "渲染失败：" + String((this.state.err && this.state.err.stack) || this.state.err));
        }
        return this.props.children;
      }
    }

    function scrollPluginPageToBottom() {
      const scrollables = () => {
        const out = [];
        const all = document.querySelectorAll("div, main, section, article");
        for (let i = 0; i < all.length; i += 1) {
          const el = all[i];
          if (el.scrollHeight - el.clientHeight <= 60) continue;
          const cs = window.getComputedStyle(el);
          if (!/(auto|scroll)/.test(cs.overflowY)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 400 || r.left < 180) continue;
          out.push(el);
        }
        return out;
      };
      const attempt = () => {
        try {
          const els = scrollables();
          els.sort((a, b) => (b.clientHeight * b.clientWidth) - (a.clientHeight * a.clientWidth));
          if (els.length > 0) els[0].scrollTop = els[0].scrollHeight;
          const doc = document.scrollingElement || document.documentElement;
          if (doc) doc.scrollTop = doc.scrollHeight;
        } catch (e) { /* 忽略：滚动只是锦上添花 */ }
      };
      setTimeout(attempt, 120);
      setTimeout(attempt, 400);
      setTimeout(attempt, 900);
    }

    function scrollPluginPageToTop() {
      const attempt = () => {
        try {
          const all = document.querySelectorAll("div, main, section, article");
          const out = [];
          for (let i = 0; i < all.length; i += 1) {
            const el = all[i];
            if (el.scrollHeight - el.clientHeight <= 60) continue;
            const cs = window.getComputedStyle(el);
            if (!/(auto|scroll)/.test(cs.overflowY)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 400 || r.left < 180) continue;
            out.push(el);
          }
          out.sort((a, b) => (b.clientHeight * b.clientWidth) - (a.clientHeight * a.clientWidth));
          if (out.length > 0) out[0].scrollTop = 0;
          const doc = document.scrollingElement || document.documentElement;
          if (doc) doc.scrollTop = 0;
        } catch (e) { /* 忽略：滚动失败不影响页面 */ }
      };
      attempt();
      setTimeout(attempt, 80);
    }

    function BackToTopSection(props) {
      const subject = props && props.subject;
      if (subject && subject.kind && subject.kind !== "bundle") return null;
      return h("div", { style: { display: "flex", justifyContent: "flex-end", padding: "10px 0 6px" } },
        h("button", {
          type: "button",
          style: {
            background: "transparent",
            border: "1px solid currentColor",
            borderRadius: "6px",
            color: "inherit",
            cursor: "pointer",
            fontSize: "12px",
            opacity: 0.72,
            padding: "4px 10px"
          },
          onClick: () => scrollPluginPageToTop()
        }, "↑ 回到顶部")
      );
    }

    const CACHE_KEY = "dsh-plugin-versions:cache:v1";

    function readCache() {
      try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object" || !Array.isArray(d.bundles) || !d.rows) return null;
        return d;
      } catch (e) { return null; }
    }

    function writeCache(bundles, rows, at) {
      try {
        const keep = {};
        Object.keys(rows || {}).forEach((k) => {
          const r = rows[k];
          if (r && r.status === "ready") keep[k] = r;
        });
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({
          at: at || Date.now(),
          bundles: bundles || [],
          rows: keep
        }));
      } catch (e) { /* 缓存写失败不影响使用 */ }
    }

    function clockText(ms) {
      try {
        const d = new Date(ms);
        return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      } catch (e) { return ""; }
    }

    function VersionsTab(props) {
      const ctx = props.ctx;
      const openPackage = props.openPackage;
      const cached = readCache();
      const [state, setState] = React.useState(
        cached
          ? { status: "ready", bundles: cached.bundles, error: null }
          : { status: "loading", bundles: [], error: null }
      );
      const [rows, setRows] = React.useState(cached ? cached.rows : {});
      const [checkedAt, setCheckedAt] = React.useState(cached ? cached.at || 0 : 0);
      const [refreshing, setRefreshing] = React.useState(true);
      const [nonce, setNonce] = React.useState(0);
      const [pmState, setPmState] = React.useState(null);

      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        let tries = 0;

        const describe = (err) => {
          let r = null;
          try { r = ctx && ctx.remote; } catch (e) { return "取 ctx.remote 抛错：" + String(e && e.message || e); }
          if (!r) return "ctx.remote 为空" + (err ? "；" + String(err && err.message || err) : "");
          let keys = [];
          try { keys = Object.keys(r); } catch (e) { keys = ["<Object.keys 抛错:" + String(e && e.message || e) + ">"]; }
          return "ctx.remote 的命名空间: [" + keys.join(", ") + "]" + (err ? "；取 pluginManager 抛错: " + String(err && err.message || err) : "");
        };

        const load = (pm) => {
          setPmState(pm);
          setRefreshing(true);
          Promise.resolve().then(() => pm.listBundles()).then((res) => {
            if (cancelled) return;
            if (res && res.ok === false) {
              const e = res.error || {};
              setState({ status: "error", bundles: [], error: String(e.message || e.code || "listBundles 失败") });
              return;
            }
            const value = res && res.ok === true ? res.value : res;
            const list = Array.isArray(value) ? value : [];
            setState({ status: "ready", bundles: list, error: null });
            setRows((prev) => { writeCache(list, prev, Date.now()); return prev; });
          }).catch((err) => {
            if (cancelled) return;
            setState({ status: "error", bundles: [], error: String((err && err.message) || err) });
          });
        };

        const attempt = () => {
          if (cancelled) return;
          let pm = null;
          let err = null;
          try { pm = ctx && ctx.remote && ctx.remote.pluginManager; } catch (e) { err = e; }
          if (pm) { load(pm); return; }
          tries += 1;
          if (tries < 12) { timer = setTimeout(attempt, 250); return; }
          const why = describe(err);
          setState({ status: "error", bundles: [], error: "拿不到 pluginManager。" + why });
        };

        attempt();
        return () => { cancelled = true; if (timer) clearTimeout(timer); };
      }, [nonce]);

      React.useEffect(() => {
        if (state.status !== "ready" || !pmState) return undefined;
        let cancelled = false;
        const queue = state.bundles.filter((b) => b && b.installed && b.name && b.updatable && !b.official);
        (async () => {
          for (const b of queue) {
            if (cancelled) return;
            setRows((prev) => (prev[b.name] && prev[b.name].status === "ready")
              ? prev
              : Object.assign({}, prev, { [b.name]: { status: "loading" } }));
            let next;
            try {
              const res = await pmState.listVersions(b.name, {});
              if (res && res.ok === false) {
                const e = res.error || {};
                next = { status: "error", error: String(e.message || e.code || "listVersions 失败") };
              } else {
                next = { status: "ready", list: (res && res.ok === true ? res.value : res) || null };
              }
            } catch (err) {
              next = { status: "error", error: String((err && err.message) || err) };
            }
            if (cancelled) return;
            setRows((prev) => {
              const nextRows = Object.assign({}, prev, { [b.name]: next });
              writeCache(state.bundles, nextRows, Date.now());
              return nextRows;
            });
          }
          if (cancelled) return;
          setCheckedAt(Date.now());
          setRefreshing(false);
        })();
        return () => { cancelled = true; };
      }, [state.status, state.bundles, pmState]);

      const installed = state.bundles.filter((b) => b && b.installed === true);
      const checked = installed.filter((b) => rows[b.name] && rows[b.name].status === "ready" && rows[b.name].list && rows[b.name].list.status === "listed");
      const newer = checked.filter((b) => (rows[b.name].list.versions || []).length > 0).length;
      const failed = installed.filter((b) => rows[b.name] && rows[b.name].status === "error").length;
      const pending = installed.filter((b) => b.updatable === true && b.official !== true && !rows[b.name]).length;
      const header = h("div", { style: S.bar },
        h("span", { style: { opacity: 0.45, fontSize: "11px" } }, "版本一览 v11"),
        h("span", { style: S.muted },
          state.status === "loading" ? "正在读取已安装组合包…" :
          state.status === "error" ? "读取失败" :
          ((newer > 0 ? newer + " 个可更新" : (pending > 0 ? "正在检查…" : "全部已是最新")) + (failed > 0 ? " · " + failed + " 个检查失败" : "") + " · 共 " + installed.length + " 个已安装")),
        h("span", { style: { opacity: 0.5, fontSize: "11px", marginLeft: "8px" } },
          checkedAt ? ("检查于 " + clockText(checkedAt)) : ""),
        refreshing && state.status !== "loading"
          ? h("span", { style: { opacity: 0.5, fontSize: "11px", marginLeft: "6px" } }, "刷新中…")
          : null,
        h("span", { style: { flex: "1 1 auto" } }),
        h("button", { style: S.btn, onClick: () => setNonce(nonce + 1), disabled: state.status === "loading" }, "刷新")
      );

      if (state.status === "error") {
        return h("div", { style: S.root }, header, h("div", { style: S.err }, state.error));
      }
      if (state.status === "loading") {
        return h("div", { style: S.root }, header, h("div", { style: S.muted }, "加载中…"));
      }
      if (state.bundles.length === 0) {
        return h("div", { style: S.root }, header, h("div", { style: S.muted }, "没有已安装的组合包。"));
      }

      const head = h("div", { style: Object.assign({}, S.row, S.head) },
        h("span", null, "组合包"), h("span", null, "当前版本"), h("span", null, "最新版本"), h("span", null, "状态"));

      const ordered = installed.slice().sort((a, b) => {
        const ua = rows[a.name] && rows[a.name].list && (rows[a.name].list.versions || []).length > 0;
        const ub = rows[b.name] && rows[b.name].list && (rows[b.name].list.versions || []).length > 0;
        if (ua === ub) return String(a.name).localeCompare(String(b.name));
        return ua ? -1 : 1;
      });
      const list = ordered.map((b) => {
        const slot = rows[b.name] || null;
        const canCheck = b.updatable === true && b.official !== true;
        const canOpen = typeof openPackage === "function" && canCheck;
        const listed = slot && slot.status === "ready" && slot.list && slot.list.status === "listed" ? slot.list : null;
        const newest = listed && Array.isArray(listed.versions) && listed.versions.length > 0 ? listed.versions[0] : null;
        let latestCell = "—";
        let latestTitle = "";
        let statusText = "";
        let tone = null;
        if (b.official === true) {
          statusText = "随 DSH 更新";
        } else if (b.updatable !== true) {
          statusText = "无官方版本区块";
          latestTitle = "这个包不是从 registry 安装的，官方不给版本区块";
        } else if (!slot) {
          statusText = "检查中…";
          latestCell = "…";
        } else if (slot.status === "error") {
          statusText = "检查失败";
          latestCell = String(slot.error || "未知错误").slice(0, 34);
          latestTitle = String(slot.error || "未知错误");
          tone = S.upd;
        } else if (!listed) {
          const pr = slot.list && slot.list.problem;
          statusText = pr === "network" ? "网络不可达" : pr === "not-found" ? "注册表未找到" : pr === "not-updatable" ? "无可查版本" : "无法查询";
          latestTitle = (slot.list && slot.list.reason) || "";
        } else if (newest) {
          statusText = "可更新到 " + newest.version;
          latestCell = newest.version;
          tone = S.upd;
        } else {
          statusText = "已是最新";
        }
        const badge = Object.assign({}, S.badge, tone || {});
        return h("div", {
          key: b.name,
          style: Object.assign({}, S.row, canOpen ? S.click : {}),
          title: (b.description || b.name) + (latestTitle ? " · " + latestTitle : ""),
          onClick: canOpen ? () => { openPackage(b.name); scrollPluginPageToBottom(); } : undefined
        },
          h("span", { style: S.name }, b.name),
          h("span", null, b.version || "—"),
          h("span", { title: latestTitle || undefined }, latestCell),
          h("span", null, h("span", { style: badge }, statusText))
        );
      });

      const firstErr = installed.map((b) => rows[b.name]).filter((r) => r && r.status === "error")[0];
      return h("div", { style: S.root },
        header,
        h("div", { style: S.table }, head, list),
        h("div", { style: S.muted }, "点一行打开官方组合包页面；更新在官方的「版本」区块里完成。"),
        firstErr ? h("div", { style: Object.assign({}, S.muted, { color: "#e06c75", whiteSpace: "pre-wrap" }) }, "首个错误原文：" + String(firstErr.error || "").slice(0, 300)) : null
      );
    }

    return {
      inject: ["slots", "remote", "remote.pluginManager"],
      apply(ctx) {
        ctx.slots.inject("plugins.tab", () => {
          const off = ctx.slots.register({
            name: "plugins.tab",
            id: "dsh-plugin-versions",
            order: 40,
            label: () => "版本一览"
          }, (ownerProps) => h(TabBoundary, null, h(VersionsTab, Object.assign({ ctx }, ownerProps || {}))));
          return typeof off === "function" ? off : () => {};
        });
        ctx.slots.inject("plugins.detail.section", () => {
          const off = ctx.slots.register({
            name: "plugins.detail.section",
            id: "dsh-plugin-versions-top",
            order: 999
          }, (ownerProps) => h(BackToTopSection, ownerProps || {}));
          return typeof off === "function" ? off : () => {};
        });
      }
    };
  }
});
