// =========================================================================
// 04-SUPABASE.JS — Realtime WebSocket + Version-based Conflict Resolution
// =========================================================================

let supabaseRealtimeClient = null;
let supabaseChannel = null;
let realtimeStatus = "disconnected";
let lastPullTime = 0;
let pullInProgress = false;

function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.key) return parsed;
    }
  } catch (e) {}
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
}

function saveSupabaseConfig() {
  const urlInput = document.getElementById("inpSupabaseUrl");
  const keyInput = document.getElementById("inpSupabaseKey");
  if (!urlInput || !keyInput) return;
  const url = urlInput.value.trim().replace(/\/$/, "");
  const key = keyInput.value.trim();
  if (!url || !key) return alert("URL ва Key ни киритинг!");
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
  if (typeof addAuditLog === "function") addAuditLog("SUPABASE_CONFIG", "Янги URL/Key сақланди");
  reconnectRealtime();
  pullFromSupabase(true);
}

function initRealtime() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) { updateRealtimeBadge("no_config"); return; }
  if (typeof supabase === "undefined" || !supabase.createClient) {
    updateRealtimeBadge("fallback");
    setInterval(() => pullFromSupabase(false), 30000);
    return;
  }

  try {
    if (supabaseChannel && supabaseRealtimeClient) {
      try { supabaseRealtimeClient.removeChannel(supabaseChannel); } catch (e) {}
    }
    supabaseRealtimeClient = supabase.createClient(cfg.url, cfg.key);

    supabaseChannel = supabaseRealtimeClient
      .channel("komplayens-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "komplayens_store", filter: "id=eq.MAIN_DB" }, (payload) => {
        if (!payload.new || !payload.new.payload) return;
        const serverData = payload.new.payload;
        if (!Array.isArray(serverData.candidates)) return;

        const myUpdateTime = localStorage.getItem("MY_LAST_UPDATE");
        const serverUpdateTime = payload.new.updated_at;
        if (myUpdateTime && serverUpdateTime) {
          const diff = Math.abs(new Date(myUpdateTime) - new Date(serverUpdateTime));
          if (diff < 3000) return; // Ўз ўзгаришимиз
        }

        const serverVersion = serverData.version || 0;
        const localVersion = (appState && appState.version) || 0;
        if (serverVersion > localVersion) {
          appState = serverData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
          if (typeof renderAll === "function") renderAll();
          showToast("⚡ Бошқа компьютердан янги маълумот келди!", "success");
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") { realtimeStatus = "connected"; updateRealtimeBadge("connected"); } 
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { realtimeStatus = "error"; updateRealtimeBadge("error"); setTimeout(() => pullFromSupabase(false), 30000); } 
        else if (status === "CLOSED") { realtimeStatus = "closed"; updateRealtimeBadge("closed"); }
      });
  } catch (e) {
    updateRealtimeBadge("error");
    setInterval(() => pullFromSupabase(false), 30000);
  }
}

function updateRealtimeBadge(status) {
  const badge = document.getElementById("cloudSyncBadge");
  if (!badge) return;
  const statusMap = {
    connected: { text: "⚡ Realtime: Уланган", cls: "text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold" },
    error: { text: "⚠️ Realtime: Узилди", cls: "text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold" },
    closed: { text: "⛔ Realtime: Ёпилди", cls: "text-xs bg-slate-500/20 text-slate-300 border border-slate-400/40 px-2.5 py-0.5 rounded-full font-bold" },
    fallback: { text: "🔄 Polling режими", cls: "text-xs bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-0.5 rounded-full font-bold" },
    no_config: { text: "⚠️ Калитлар йўқ", cls: "text-xs bg-red-500/20 text-red-300 border border-red-400/40 px-2.5 py-0.5 rounded-full font-bold" },
    disconnected: { text: "🔌 Уланмоқда...", cls: "text-xs bg-slate-500/20 text-slate-300 border border-slate-400/40 px-2.5 py-0.5 rounded-full font-bold" }
  };
  const s = statusMap[status] || statusMap.disconnected;
  badge.textContent = s.text;
  badge.className = s.cls;
}

function reconnectRealtime() {
  if (typeof addAuditLog === "function") addAuditLog("REALTIME_RECONNECT", "Realtime қайта уланди");
  realtimeStatus = "disconnected";
  updateRealtimeBadge("disconnected");
  initRealtime();
  showToast("⚡ Realtime қайта уланмоқда...", "info");
}

async function pushToSupabase() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) return;
  
  const now = new Date().toISOString();
  localStorage.setItem("MY_LAST_UPDATE", now);
  
  try {
    // 🆕 Конфликт текшируви
    const checkRes = await fetch(`${cfg.url}/rest/v1/komplayens_store?id=eq.MAIN_DB&select=payload`, {
      headers: { "apikey": cfg.key, "Authorization": `Bearer ${cfg.key}` }
    });
    const checkData = await checkRes.json();
    
    if (checkData && checkData.length > 0 && checkData[0].payload) {
      const serverVersion = checkData[0].payload.version || 0;
      const localVersion = appState.version || 0;
      
      if (serverVersion > localVersion && localVersion !== 0) {
        // Сервердаги маълумот янгироқ, бизникини устидан ёзмаймиз!
        appState = checkData[0].payload;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        if (typeof renderAll === "function") renderAll();
        showToast("⚠️ Бошқа фойдаланувчи ўзгартирган. База янгиланди.", "warning");
        return;
      }
    }

    await fetch(`${cfg.url}/rest/v1/komplayens_store?on_conflict=id`, {
      method: "POST",
      headers: { "apikey": cfg.key, "Authorization": `Bearer ${cfg.key}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: "MAIN_DB", payload: appState, updated_at: now })
    });
  } catch (e) {
    console.warn("Supabase push error:", e);
  }
}

async function pullFromSupabase(showNotification = false) {
  if (pullInProgress) return;
  const now = Date.now();
  if (!showNotification && now - lastPullTime < 5000) return;
  lastPullTime = now;
  pullInProgress = true;

  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) { pullInProgress = false; return; }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/komplayens_store?id=eq.MAIN_DB&select=payload,updated_at`, {
      headers: { "apikey": cfg.key, "Authorization": `Bearer ${cfg.key}` }
    });
    if (!res.ok) { pullInProgress = false; return; }
    const rows = await res.json();

    if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
      const serverData = rows[0].payload;
      const serverVersion = serverData.version || 0;
      const localVersion = (appState && appState.version) || 0;

      if (serverVersion > localVersion) {
        appState = serverData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        if (typeof renderAll === "function") renderAll();
        if (showNotification) showToast("✅ Онлайн базадан янгиланди", "success");
      } else if (showNotification) {
        showToast("✅ База энг сўнгги версияда", "info");
      }
    } else {
      await pushToSupabase();
    }
  } catch (e) {
    if (showNotification) showToast("❌ Онлайн базага уланиб бўлмади", "error");
  } finally {
    pullInProgress = false;
  }
}

function copySupabaseSql() {
  const sql = `ALTER PUBLICATION supabase_realtime ADD TABLE komplayens_store;`;
  navigator.clipboard.writeText(sql);
  alert("SQL код нусхаланди!");
}
