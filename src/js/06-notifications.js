// =========================================================================
// 06-NOTIFICATIONS.JS — 🔔 Уведомления тизими
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// -------------------- ГЛОБАЛ ЎЗГАРУВЧИЛАР --------------------
let notificationsList = [];
let notificationPanelOpen = false;
let notificationSoundEnabled = true;

// =========================================================================
// ЮКЛАШ ВА САҚЛАШ
// =========================================================================

// -------------------- ЮКЛАШ --------------------
function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        notificationsList = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Notifications load warning:", e);
  }
  notificationsList = [];
  return [];
}

// -------------------- САҚЛАШ --------------------
function saveNotifications() {
  try {
    // Фақат 200 та охирги уведомленияни сақлаш (localStorage тўлиб қолмаслиги учун)
    const trimmed = notificationsList.slice(-200);
    notificationsList = trimmed;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Notifications save warning:", e);
  }
}

// =========================================================================
// УВЕДОМЛЕНИЯ ҚЎШИШ
// =========================================================================

// -------------------- АСОСИЙ ФУНКЦИЯ --------------------
function addNotification(data) {
  if (!data || !data.type) {
    console.warn("Notification: type кўрсатилмаган");
    return;
  }

  const now = getNow();

  const notification = {
    id: "NOTIF-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    type: data.type,
    candidateId: data.candidateId || "",
    candidateName: data.candidateName || "",
    message: data.message || "",
    detail: data.detail || "",
    forRoles: Array.isArray(data.forRoles) ? data.forRoles : [],
    forUsers: Array.isArray(data.forUsers) ? data.forUsers : [],
    createdAt: now.dateTime,
    createdAtISO: new Date().toISOString(),
    read: false,
    readBy: []
  };

  notificationsList.push(notification);
  saveNotifications();

  // Badge ни янгилаш
  updateNotificationBadge();

  // Хабар кўрсатиш
  if (notificationSoundEnabled) {
    showNotificationToast(notification);
    playNotificationSound();
  }

  console.log("🔔 Янги уведомление:", notification.message);

  return notification;
}

// -------------------- УВЕДОМЛЕНИЯ ТОСТИ --------------------
function showNotificationToast(notification) {
  // Экранда тост кўрсатиш
  const toast = document.createElement("div");
  toast.className = "fixed top-20 right-4 z-[9999] bg-white border-l-4 border-blue-500 shadow-2xl rounded-xl p-4 max-w-sm cursor-pointer";
  toast.style.transform = "translateX(400px)";
  toast.style.transition = "all 0.3s ease";

  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-2xl">${getNotificationIcon(notification.type)}</div>
      <div class="flex-1">
        <div class="font-bold text-slate-900 text-sm mb-1">${notification.message}</div>
        <div class="text-xs text-slate-600 mb-1">${notification.candidateName}</div>
        <div class="text-[10px] text-slate-400">${notification.createdAt}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-red-600 font-bold">✕</button>
    </div>
  `;

  toast.onclick = () => {
    openNotificationPanel();
    toast.remove();
  };

  document.body.appendChild(toast);

  // Анимация
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 50);

  // Автоматик ўчириш (7 сониядан кейин)
  setTimeout(() => {
    toast.style.transform = "translateX(400px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 7000);
}

// -------------------- ОВОЗ (товуш) --------------------
function playNotificationSound() {
  try {
    // Web Audio API орқали оддий товуш
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Товуш ишламаса — эътиборсиз
    console.warn("Notification sound warning:", e);
  }
}

// -------------------- ИКОНКА ТАНЛАШ --------------------
function getNotificationIcon(type) {
  const icons = {
    new_candidate: "🆕",
    sent_to_boss: "📤",
    boss_viewed: "👁",
    approved: "✅",
    returned: "↩️",
    candidate_edited: "✏️",
    candidate_deleted: "🗑"
  };
  return icons[type] || "🔔";
}

// =========================================================================
// ЎҚИШ БЕЛГИЛАРИ
// =========================================================================

// -------------------- БИТТА ЎҚИЛГАН --------------------
function markNotificationAsRead(id) {
  const notif = notificationsList.find(n => n.id === id);
  if (!notif) return;
  notif.read = true;
  saveNotifications();
  updateNotificationBadge();
  renderNotificationPanel();
}

// -------------------- ҲАММАСИНИ ЎҚИЛГАН --------------------
function markAllNotificationsAsRead() {
  const myRole = currentRole;
  if (!myRole) return;

  let count = 0;
  notificationsList.forEach(n => {
    if (!n.read && canSeeNotification(n, myRole)) {
      n.read = true;
      count++;
    }
  });

  if (count > 0) {
    saveNotifications();
    updateNotificationBadge();
    renderNotificationPanel();
    showToast(`✅ ${count} та уведомление ўқилди`, "success");
  }
}

// =========================================================================
// РОЛ БЎЙИЧА ФИЛЬТРЛАШ
// =========================================================================

// -------------------- УШБУ УВЕДОМЛЕНИЯ КЎРИНАДИМИ? --------------------
function canSeeNotification(notification, role) {
  if (!notification) return false;
  if (!Array.isArray(notification.forRoles)) return false;
  return notification.forRoles.includes(role);
}

// -------------------- РОЛ УЧУН УВЕДОМЛЕНИЯЛАР --------------------
function getNotificationsForRole(role) {
  if (!role) return [];
  return notificationsList.filter(n => canSeeNotification(n, role));
}

// -------------------- ЎҚИЛМАГАНЛАР СОНИ --------------------
function getUnreadCount(role) {
  if (!role) return 0;
  return notificationsList.filter(n =>
    !n.read && canSeeNotification(n, role)
  ).length;
}

// =========================================================================
// ПАНЕЛ КЎРСАТИШ
// =========================================================================

// -------------------- ПАНЕЛНИ ОЧИШ/ЁПИШ --------------------
function toggleNotificationPanel() {
  notificationPanelOpen = !notificationPanelOpen;

  const panel = document.getElementById("notificationPanel");
  if (!panel) return;

  if (notificationPanelOpen) {
    panel.classList.remove("hidden");
    renderNotificationPanel();
  } else {
    panel.classList.add("hidden");
  }
}

// -------------------- ПАНЕЛНИ ОЧИШ --------------------
function openNotificationPanel() {
  notificationPanelOpen = true;
  const panel = document.getElementById("notificationPanel");
  if (panel) {
    panel.classList.remove("hidden");
    renderNotificationPanel();
  }
}

// -------------------- ПАНЕЛНИ ЁПИШ --------------------
function closeNotificationPanel() {
  notificationPanelOpen = false;
  const panel = document.getElementById("notificationPanel");
  if (panel) panel.classList.add("hidden");
}

// =========================================================================
// ПАНЕЛНИ ЧИЗИШ
// =========================================================================

function renderNotificationPanel() {
  const listEl = document.getElementById("notificationList");
  if (!listEl) return;

  const myNotifs = getNotificationsForRole(currentRole);

  if (myNotifs.length === 0) {
    listEl.innerHTML = `
      <div class="p-8 text-center text-slate-500">
        <div class="text-4xl mb-2">🔔</div>
        <div class="font-bold">Уведомлениялар йўқ</div>
        <div class="text-xs mt-1">Янги ҳодисалар шу ерда кўринади</div>
      </div>
    `;
    return;
  }

  // Энг янги юқорида
  const sorted = myNotifs.slice().reverse();

  listEl.innerHTML = sorted.map(n => {
    const icon = getNotificationIcon(n.type);
    const unreadClass = n.read
      ? "bg-white border-slate-200"
      : "bg-blue-50 border-blue-300";
    const unreadDot = n.read
      ? ""
      : `<span class="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>`;

    // Candidate ни топиш (босиш учун)
    const candidate = n.candidateId
      ? appState.candidates.find(c => c.id === n.candidateId)
      : null;

    const onclick = candidate
      ? `onclick="handleNotificationClick('${n.id}', '${n.candidateId}')"`
      : `onclick="markNotificationAsRead('${n.id}')"`;

    return `
      <div class="p-3 border-l-4 ${unreadClass} rounded-lg mb-2 cursor-pointer hover:shadow-md transition"
           ${onclick}>
        <div class="flex items-start gap-2">
          <div class="text-xl">${icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-bold text-sm text-slate-900">${n.message}</span>
              ${unreadDot}
            </div>
            ${n.candidateName ? `<div class="text-xs font-semibold text-slate-700">${n.candidateName}</div>` : ""}
            ${n.detail ? `<div class="text-xs text-slate-500 mt-0.5">${n.detail.substring(0, 80)}</div>` : ""}
            <div class="text-[10px] text-slate-400 mt-1 font-mono">${n.createdAt}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------- УВЕДОМЛЕНИЯ БОСИЛГАНДА --------------------
function handleNotificationClick(notifId, candidateId) {
  markNotificationAsRead(notifId);
  closeNotificationPanel();

  // Номзодни топиш
  if (!candidateId) return;

  const candidate = appState.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  // Фототаблицага ўтиб, номзодни кўрсатиш
  if (typeof switchTab === "function") {
    switchTab("fototablitsa");
  }

  // Агар очиш мумкин бўлса — очиш
  setTimeout(() => {
    if (typeof openDocModal === "function") {
      // Фақат тасдиқланганларни оча олади (роль бўйича)
      if (candidate.workflowStage === "approved") {
        openDocModal(candidateId);
      } else if (currentRole === "korrupsiya" && candidate.workflowStage === "admin_review") {
        if (typeof openEditorModal === "function") {
          openEditorModal(candidateId);
        }
      }
    }
  }, 300);
}

// =========================================================================
// BADGE ЯНГИЛАШ
// =========================================================================

function updateNotificationBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;

  const count = getUnreadCount(currentRole);

  if (count === 0) {
    badge.style.display = "none";
  } else {
    badge.style.display = "flex";
    badge.textContent = count > 99 ? "99+" : count;
  }
}

// =========================================================================
// ЭСКИ УВЕДОМЛЕНИЯЛАРНИ ТОЗАЛАШ
// =========================================================================

function clearOldNotifications(days = 30) {
  if (currentRole !== ROLES.KORRUPSIYA) {
    alert("Рухсат йўқ!");
    return;
  }

  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const before = notificationsList.length;

  notificationsList = notificationsList.filter(n => {
    return new Date(n.createdAtISO).getTime() > cutoff;
  });

  const removed = before - notificationsList.length;

  if (removed > 0) {
    saveNotifications();
    updateNotificationBadge();
    renderNotificationPanel();
    showToast(`🗑 ${removed} та эски уведомление ўчирилди`, "info");
  } else {
    showToast("Эски уведомлениялар йўқ", "info");
  }
}

// =========================================================================
// ТОВУШНИ ЁҚИШ/ЎЧИРИШ
// =========================================================================

function toggleNotificationSound() {
  notificationSoundEnabled = !notificationSoundEnabled;
  localStorage.setItem("KOMPLAYENS_NOTIF_SOUND", notificationSoundEnabled ? "1" : "0");

  const btn = document.getElementById("notifSoundBtn");
  if (btn) {
    btn.textContent = notificationSoundEnabled ? "🔔" : "🔕";
    btn.title = notificationSoundEnabled ? "Товуш ёқилган" : "Товуш ўчирилган";
  }

  showToast(
    notificationSoundEnabled ? "🔔 Товуш ёқилди" : "🔕 Товуш ўчирилди",
    "info"
  );
}

// -------------------- ТОВУШ СОЗЛАМАСИНИ ЮКЛАШ --------------------
function loadNotificationSoundSetting() {
  const saved = localStorage.getItem("KOMPLAYENS_NOTIF_SOUND");
  if (saved === "0") {
    notificationSoundEnabled = false;
  } else {
    notificationSoundEnabled = true;
  }

  const btn = document.getElementById("notifSoundBtn");
  if (btn) {
    btn.textContent = notificationSoundEnabled ? "🔔" : "🔕";
  }
}

// =========================================================================
// ПАНЕЛДАН ТАШҚАРИСИГА БОСИЛГАНДА ЁПИШ
// =========================================================================

document.addEventListener("click", (e) => {
  if (!notificationPanelOpen) return;

  const panel = document.getElementById("notificationPanel");
  const bellBtn = document.getElementById("notifBellBtn");

  if (panel && !panel.contains(e.target) && bellBtn && !bellBtn.contains(e.target)) {
    closeNotificationPanel();
  }
});

// -------------------- ЛОГ ----------
console.log("✅ 06-notifications.js юкланди");
