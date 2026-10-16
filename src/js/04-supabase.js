// =========================================================================
// 04-SUPABASE.JS — Supabase Realtime WebSocket + Version-based Sync
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// -------------------- ГЛОБАЛ ЎЗГАРУВЧИЛАР --------------------
let supabaseRealtimeClient = null;
let supabaseChannel = null;
let realtimeStatus = "disconnected";
let lastPullTime = 0;
let pullInProgress = false;

// =========================================================================
// КОНФИГУРАЦИЯ
// =========================================================================

// -------------------- КОНФИГНИ ЮКЛАШ --------------------
function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.key) return parsed;
    }
  } catch (e) {
    console.warn("Supabase config warning:", e);
  }
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
}

// -------------------- КОНФИГНИ САҚЛАШ --------------------
function saveSupabaseConfig() {
  const urlInput = document.getElementById("inpSupabaseUrl");
  const keyInput = document.getElementById("inpSupabaseKey");

  if (!urlInput || !keyInput) {
    alert("Созлама майдонлари топилмади!");
    return;
  }

  const url = urlInput.value.trim().replace(/\/$/, "");
  const key = keyInput.value.trim();

  if (!url || !key) {
    alert("Supabase Project URL ва API Key ни киритинг!");
    return;
  }

  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));

  if (typeof addAuditLog === "function") {
    addAuditLog("SUPABASE_CONFIG", "Янги URL/Key сақланди");
  }

  reconnectRealtime();
  pullFromSupabase(true);
}

// =========================================================================
// ⚡ REALTIME WEBSOCKET
// =========================================================================

// -------------------- REALTIME ИШГА ТУШИРИШ --------------------
function initRealtime() {
  const cfg = getSupabaseConfig();

  if (!cfg.url || !cfg.key) {
    console.warn("⚠️ Supabase калитлари йўқ");
    updateRealtimeBadge("no_config");
    return;
  }

  if (typeof supabase === "undefined" || !supabase.createClient) {
    console.warn("⚠️ Supabase SDK юкланмаган — polling fallback");
    updateRealtimeBadge("fallback");
    setInterval(() => pullFromSupabase(false), 30000);
    return;
  }

  try {
    // Аввалги уланишни узиш
    if (supabaseChannel && supabaseRealtimeClient) {
      try {
        supabaseRealtimeClient.removeChannel(supabaseChannel);
      } catch (e) {
        console.warn("Old channel remove warning:", e);
      }
    }

    supabaseRealtimeClient = supabase.createClient(cfg.url, cfg.key);

    supabaseChannel = supabaseRealtimeClient
      .channel("komplayens-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "komplayens_store",
          filter: "id=eq.MAIN_DB"
        },
        (payload) => {
          console.log("⚡ Realtime янгилик:", new Date().toLocaleTimeString());

          if (!payload.new || !payload.new.payload) return;

          const serverData = payload.new.payload;
          if (!Array.isArray(serverData.candidates)) return;

          const myUpdateTime = localStorage.getItem("MY_LAST_UPDATE");
          const serverUpdateTime = payload.new.updated_at;

          // Ўз ўзгаришимизни ўтказиб юбориш (3 сония ичида)
          if (myUpdateTime && serverUpdateTime) {
            const diff = Math.abs(new Date(myUpdateTime) - new Date(serverUpdateTime));
            if (diff < 3000) {
              console.log("⏭ Ўз ўзгаришимиз — ўтказиб юборамиз");
              return;
            }
          }

          // Version-based текширув
          const serverVersion = serverData.version || 0;
          const localVersion = (appState && appState.version) || 0;

          if (serverVersion > localVersion) {
            appState = serverData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

            if (typeof renderAll === "function") {
              renderAll();
            }

            showToast("⚡ Янги маълумот келди!", "success");
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime статус:", status);

        if (status === "SUBSCRIBED") {
          realtimeStatus = "connected";
          updateRealtimeBadge("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          realtimeStatus = "error";
          updateRealtimeBadge("error");
          // Fallback: 30 сониядан кейин polling
          setTimeout(() => pullFromSupabase(false), 30000);
        } else if (status === "CLOSED") {
          realtimeStatus = "closed";
          updateRealtimeBadge("closed");
        }
      });

  } catch (e) {
    console.error("Realtime init xatoligi:", e);
    updateRealtimeBadge("error");
    setInterval(() => pullFromSupabase(false), 30000);
  }
}

// -------------------- BADGE ЯНГИЛАШ --------------------
function updateRealtimeBadge(status) {
  const badge = document.getElementById("cloudSyncBadge");
  if (!badge) return;

  const statusMap = {
    connected: {
      text: "⚡ Realtime: Уланган",
      cls: "text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold"
    },
    error: {
      text: "⚠️ Realtime: Узилди",
      cls: "text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold"
    },
    closed: {
      text: "⛔ Realtime: Ёпилди",
      cls: "text-xs bg-slate-500/20 text-slate-300 border border-slate-400/40 px-2.5 py-0.5 rounded-full font-bold"
    },
    fallback: {
      text: "🔄 Polling режими",
      cls: "text-xs bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-0.5 rounded-full font-bold"
    },
    no_config: {
      text: "⚠️ Калитлар йўқ",
      cls: "text-xs bg-red-500/20 text-red-300 border border-red-400/40 px-2.5 py-0.5 rounded-full font-bold"
    },
    disconnected: {
      text: "🔌 Уланмоқда...",
      cls: "text-xs bg-slate-500/20 text-slate-300 border border-slate-400/40 px-2.5 py-0.5 rounded-full font-bold"
    }
  };

  const s = statusMap[status] || statusMap.disconnected;
  badge.textContent = s.text;
  badge.className = s.cls;
}

// -------------------- REALTIME ҚАЙТА УЛАШ --------------------
function reconnectRealtime() {
  if (typeof addAuditLog === "function") {
    addAuditLog("REALTIME_RECONNECT", "Realtime қайта улаш");
  }

  realtimeStatus = "disconnected";
  updateRealtimeBadge("disconnected");

  initRealtime();
  showToast("⚡ Realtime қайта уланмоқда...", "info");
}

// =========================================================================
// PUSH — SUPABASE ГА ЮБОРИШ (version-based)
// =========================================================================

async function pushToSupabase() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) return;

  // Ўз ўзгаришимиз вақтини сақлаймиз
  const now = new Date().toISOString();
  localStorage.setItem("MY_LAST_UPDATE", now);

  try {
    const res = await fetch(`${cfg.url}/rest/v1/komplayens_store?on_conflict=id`, {
      method: "POST",
      headers: {
        "apikey": cfg.key,
        "Authorization": `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        id: "MAIN_DB",
        payload: appState,
        updated_at: now
      })
    });

    if (!res.ok) {
      console.warn("Push xato, status:", res.status);
      const badge = document.getElementById("cloudSyncBadge");
      if (badge && realtimeStatus !== "connected") {
        badge.textContent = "⚠️ SQL жадвални текширинг";
        badge.className = "text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold";
      }
    }
  } catch (e) {
    console.warn("Supabase push error:", e);
  }
}

// =========================================================================
// PULL — SUPABASE ДАН ТОРТИШ
// =========================================================================

async function pullFromSupabase(showNotification = false) {
  // Қайта-қайта сўров юбормаслик учун
  if (pullInProgress) return;

  const now = Date.now();
  if (!showNotification && now - lastPullTime < 5000) {
    return; // Охирги 5 сонияда сўраган бўлсак, ўтказиб юборамиз
  }
  lastPullTime = now;
  pullInProgress = true;

  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) {
    pullInProgress = false;
    return;
  }

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/komplayens_store?id=eq.MAIN_DB&select=payload,updated_at`,
      {
        headers: {
          "apikey": cfg.key,
          "Authorization": `Bearer ${cfg.key}`
        }
      }
    );

    if (!res.ok) {
      if (showNotification) {
        alert("Диққат! Supabase уланди, лекин «komplayens_store» жадвали топилмади.\n\nSQL Editor да жадвал яратинг!");
      }
      pullInProgress = false;
      return;
    }

    const rows = await res.json();

    if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
      const serverData = rows[0].payload;

      if (!Array.isArray(serverData.candidates)) {
        pullInProgress = false;
        return;
      }

      const serverVersion = serverData.version || 0;
      const localVersion = (appState && appState.version) || 0;

      // Фақат сервер версияси каттароқ бўлса янгилаш
      if (serverVersion > localVersion) {
        appState = serverData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

        if (typeof renderAll === "function") {
          renderAll();
        }

        if (showNotification) {
          showToast("✅ Онлайн базадан янгиланди", "success");
        }
      } else if (showNotification) {
        showToast("✅ База энг сўнгги версияда", "info");
      }
    } else {
      // Бўш сервер — биринчи марта юбориш
      await pushToSupabase();
    }
  } catch (e) {
    console.warn("Supabase pull warning:", e);
    if (showNotification) {
      showToast("❌ Онлайн базага уланиб бўлмади", "error");
    }
  } finally {
    pullInProgress = false;
  }
}

// =========================================================================
// SQL КОДНИ НУСХАЛАШ
// =========================================================================

function copySupabaseSql() {
  const sql = `-- ============================================
-- КОМПЛАЕНС-КАДР v9.0 — Supabase схема
-- ============================================

-- 1. Жадвал яратиш
CREATE TABLE IF NOT EXISTS komplayens_store (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS ёқиш
ALTER TABLE komplayens_store ENABLE ROW LEVEL SECURITY;

-- 3. Очиқ сиёсат (кейинроқ хавфсизроқ қиламиз)
DROP POLICY IF EXISTS "Allow all access" ON komplayens_store;
CREATE POLICY "Allow all access" 
  ON komplayens_store FOR ALL 
  USING (true) WITH CHECK (true);

-- 4. ⚡ REALTIME ни ёқиш (ЭНГ МУҲИМ!)
ALTER PUBLICATION supabase_realtime ADD TABLE komplayens_store;

-- 5. Текшириш
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(sql).then(() => {
      alert("✅ SQL код нусхаланди!\n\nSupabase → SQL Editor да Run қилинг.");
    }).catch(() => {
      alert("❌ Нусхалаш амалга ошмади. Қўлда кўчиринг.");
    });
  } else {
    alert("Браузер нусхалашни қўлламайди.");
  }
}

// =========================================================================
// ЁРДАМЧИ: СИНОВ УЧУН
// =========================================================================

// -------------------- СУПАБАСЕ ҲОЛАТИНИ КЎРСАТИШ --------------------
async function testSupabaseConnection() {
  const cfg = getSupabaseConfig();

  console.log("=== SUPABASE ҲОЛАТИ ===");
  console.log("URL:", cfg.url);
  console.log("Key:", cfg.key.substring(0, 20) + "...");
  console.log("Realtime status:", realtimeStatus);

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/komplayens_store?id=eq.MAIN_DB`,
      {
        headers: {
          "apikey": cfg.key,
          "Authorization": `Bearer ${cfg.key}`
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Уланди. Ёзувлар:", data.length);
      console.log("Маълумот:", data);
    } else {
      console.log("❌ Хато:", res.status, res.statusText);
    }
  } catch (e) {
    console.error("❌ Уланиш хато:", e);
  }
}

// -------------------- ЛОГ ----------
console.log("✅ 04-supabase.js юкланди");
