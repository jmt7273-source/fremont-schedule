// -------------------------
// SCHEDULES (24-hour HH:MM)
// -------------------------
const SCHEDULES = {
  regular: [
    { name: "Period 1", start: "08:30", end: "09:38" },
    { name: "Period 2", start: "09:44", end: "10:41" },
    { name: "Period 3", start: "10:47", end: "11:44" },
    { name: "Lunch",    start: "11:44", end: "12:14" },
    { name: "Period 4", start: "12:20", end: "13:17" },
    { name: "Period 5", start: "13:23", end: "14:20" },
    { name: "Period 6", start: "14:26", end: "15:23" }
  ],
  tuesdayPD: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:21" },
    { name: "Period 3", start: "10:27", end: "11:14" },
    { name: "Lunch",    start: "11:14", end: "11:44" },
    { name: "Period 4", start: "11:50", end: "12:37" },
    { name: "Period 5", start: "12:43", end: "13:30" },
    { name: "Period 6", start: "13:36", end: "14:23" }
  ],
  minimum: [
    { name: "Period 1", start: "08:30", end: "09:18" },
    { name: "Period 2", start: "09:24", end: "09:59" },
    { name: "Period 3", start: "10:05", end: "10:40" },
    { name: "Lunch",    start: "10:40", end: "11:10" },
    { name: "Period 4", start: "11:16", end: "11:51" },
    { name: "Period 5", start: "11:57", end: "12:32" },
    { name: "Period 6", start: "12:38", end: "13:13" }
  ],
  shortened: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:20" },
    { name: "Period 3", start: "10:26", end: "11:12" },
    { name: "Lunch",    start: "11:12", end: "11:42" },
    { name: "Period 4", start: "11:48", end: "12:34" },
    { name: "Period 5", start: "12:40", end: "13:26" },
    { name: "Period 6", start: "13:32", end: "14:18" }
  ]
};

// -------------------------
// DOM references
// -------------------------
const progressBar = document.getElementById("progress-bar");
const barText = document.getElementById("bar-text");
const periodInfo = document.getElementById("period-info");
const liveClockEl = document.getElementById("live-clock");

// Top-right class timer DOM
const presets = Array.from(document.querySelectorAll(".preset"));
const customMin = document.getElementById("custom-min");
const customSec = document.getElementById("custom-sec");
const setCustomBtn = document.getElementById("set-custom");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const classCount = document.getElementById("class-count");

// -------------------------
// Active schedule selection (auto)
let activeSchedule = (new Date().getDay() === 2) ? SCHEDULES.tuesdayPD : SCHEDULES.regular;

// Helper to parse "HH:MM" -> Date today
function parseToday(timeHHMM) {
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setMilliseconds(0);
  return d;
}

// -------------------------
// Progress / schedule loop
// -------------------------
function updateMainClockAndSchedule() {
  const now = new Date();
  // Live clock
  liveClockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  // Find current or next
  let current = null;
  let next = null;
  for (let i = 0; i < activeSchedule.length; i++) {
    const p = activeSchedule[i];
    const startM = parseToday(p.start).getHours() * 60 + parseToday(p.start).getMinutes();
    const endM = parseToday(p.end).getHours() * 60 + parseToday(p.end).getMinutes();
    if (nowMinutes >= startM && nowMinutes < endM) {
      current = { ...p, startM, endM };
      next = (i + 1 < activeSchedule.length) ? activeSchedule[i + 1] : null;
      break;
    }
    if (nowMinutes < startM) { next = p; break; }
  }

  // After school
  if (!current && !next) {
    periodInfo.textContent = "School's Out!";
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "#6a0d15"; // darker burgundy
    barText.textContent = "School's Out!";
    return;
  }

  // Passing period (between classes)
  if (!current && next) {
    periodInfo.textContent = "Passing Period";
    const nextStart = parseToday(next.start);
    const diffSec = Math.max(0, Math.floor((nextStart - now) / 1000));
    const mm = Math.floor(diffSec / 60);
    const ss = diffSec % 60;
    const timeText = `${mm}:${String(ss).padStart(2, "0")}`;
    progressBar.style.width = "0%";
    progressBar.style.backgroundColor = "#9ca3af"; // gray
    barText.textContent = timeText;
    return;
  }

  // During a class period
  if (current) {
    const start = parseToday(current.start);
    const end = parseToday(current.end);
    const totalSec = (end - start) / 1000;
    const remainingSec = Math.max(0, Math.floor((end - now) / 1000));
    const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
    const percent = Math.max(0, Math.min(100, (elapsedSec / totalSec) * 100));
    progressBar.style.width = percent + "%";

    const mm = Math.floor(remainingSec / 60);
    const ss = remainingSec % 60;
    const timeText = `${mm}:${String(ss).padStart(2, "0")}`;

    periodInfo.textContent = current.name;

    // Red zone logic: first 15 minutes or last 15 minutes
    if (elapsedSec <= 15 * 60 || remainingSec <= 15 * 60) {
      progressBar.style.backgroundColor = "#ef4444";
      barText.textContent = `No Bathroom or Passes — ${timeText}`;
    } else {
      progressBar.style.backgroundColor = "#16a34a";
      barText.textContent = timeText;
    }
    return;
  }
}

// Run schedule updater every 500ms
setInterval(updateMainClockAndSchedule, 500);
updateMainClockAndSchedule();

// -------------------------
// Top-right class timer (presets + custom + alarm)
// -------------------------
let classTimerTotal = 0;    // seconds
let classTimerRemaining = 0;
let classTimerInterval = null;
let classTimerRunning = false;

// audio alarm using Web Audio API
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = 0;
    const duration = 2.5; // seconds
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    // simple beep pattern: descend frequency
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + duration);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    setTimeout(()=>{ o.stop(); ctx.close(); }, duration * 1000 + 100);
  } catch (e) {
    // audio failed (autoplay policy) — ignore
    console.warn("Alarm audio error", e);
  }
}

function formatMMSS(sec) {
  if (sec < 0) sec = 0;
  const mm = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  return `${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

function updateClassTimerUI() {
  classCount.textContent = formatMMSS(classTimerRemaining);
  if (classTimerRemaining <= 0 && classTimerTotal > 0) {
    // finished
    classCount.classList.add("flash");
    playAlarm();
    stopClassTimer();
  } else {
    classCount.classList.remove("flash");
  }
}

function tickClassTimer() {
  if (!classTimerRunning) return;
  classTimerRemaining = Math.max(0, classTimerRemaining - 1);
  updateClassTimerUI();
  if (classTimerRemaining <= 0) {
    // finished handled in updateClassTimerUI
  }
}

function startClassTimer() {
  if (classTimerTotal <= 0) return;
  if (!classTimerRunning) {
    classTimerRunning = true;
    classTimerInterval = setInterval(tickClassTimer, 1000);
  }
}

function pauseClassTimer() {
  classTimerRunning = false;
  if (classTimerInterval) {
    clearInterval(classTimerInterval);
    classTimerInterval = null;
  }
}

function stopClassTimer() {
  classTimerRunning = false;
  if (classTimerInterval) {
    clearInterval(classTimerInterval);
    classTimerInterval = null;
  }
}

// Reset to initial total
function resetClassTimer() {
  stopClassTimer();
  classTimerRemaining = classTimerTotal;
  updateClassTimerUI();
}

// Preset button handlers
presets.forEach(btn => {
  btn.addEventListener("click", () => {
    const seconds = parseInt(btn.dataset.sec, 10) || 0;
    classTimerTotal = seconds;
    classTimerRemaining = seconds;
    updateClassTimerUI();
  });
});

// Custom set
setCustomBtn.addEventListener("click", () => {
  const m = Math.max(0, parseInt(customMin.value, 10) || 0);
  const s = Math.max(0, parseInt(customSec.value, 10) || 0);
  const total = m * 60 + s;
  classTimerTotal = total;
  classTimerRemaining = total;
  updateClassTimerUI();
});

// Start / Pause / Reset
startBtn.addEventListener("click", () => { startClassTimer(); });
pauseBtn.addEventListener("click", () => { pauseClassTimer(); });
resetBtn.addEventListener("click", () => { resetClassTimer(); });

// initialize UI
classTimerTotal = 0;
classTimerRemaining = 0;
updateClassTimerUI();
