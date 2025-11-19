/* ===========
   CONFIG & SCHEDULES
   =========== */
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

/* ===========
   DOM References
   =========== */
const teacherBtn = document.getElementById("teacher-btn");
const teacherPanel = document.getElementById("teacher-panel");
const closePanelBtn = document.getElementById("close-panel");
const overrideSelect = document.getElementById("override-select");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const alarmToggle = document.getElementById("alarm-toggle");
const alarmVolume = document.getElementById("alarm-volume");

const progressBar = document.getElementById("progress-bar");
const barText = document.getElementById("bar-text");
const periodInfo = document.getElementById("period-info");
const liveClockEl = document.getElementById("live-clock");
const bathroomBadge = document.getElementById("bathroom-badge");

// class timer DOM
const studentPresets = Array.from(document.querySelectorAll(".student-preset"));
const teacherPresets = Array.from(document.querySelectorAll(".teacher-preset"));
const customMin = document.getElementById("custom-min");
const customSec = document.getElementById("custom-sec");
const setCustomBtn = document.getElementById("set-custom");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const classCount = document.getElementById("class-count");

const teachMin = document.getElementById("teach-min");
const teachSec = document.getElementById("teach-sec");
const teachSet = document.getElementById("teach-set");

/* ===========
   State
   =========== */
let scheduleMode = "auto"; // auto | regular | tuesdayPD | minimum | shortened
let activeSchedule = (new Date().getDay() === 2) ? SCHEDULES.tuesdayPD : SCHEDULES.regular;

// class timer state
let classTimerTotal = 0;
let classTimerRemaining = 0;
let classTimerRunning = false;
let classIntv = null;

// audio
let audioCtx = null;
let alarmEnabled = true;
let alarmGain = 0.2;

/* ===========
   Helpers
   =========== */
function parseHHMM(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h,m,0,0);
  d.setMilliseconds(0);
  return d;
}
function formatMMSS(sec){
  if (sec < 0) sec = 0;
  const m = Math.floor(sec/60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function initAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ audioCtx = null; console.warn("Audio init failed", e); }
  }
}

/* ===========
   Schedule & main loop
   =========== */
function autoSchedule(){ return (new Date().getDay() === 2) ? SCHEDULES.tuesdayPD : SCHEDULES.regular; }
overrideSelect.value = "auto";

overrideSelect.addEventListener("change", () => {
  scheduleMode = overrideSelect.value;
  if (scheduleMode === "auto") activeSchedule = autoSchedule();
  else activeSchedule = SCHEDULES[scheduleMode];
});

function updateClockAndSchedule(){
  const now = new Date();
  // live clock
  liveClockEl.textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});

  // auto schedule mode
  if (scheduleMode === "auto") activeSchedule = autoSchedule();

  const nowMinutes = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;

  let current = null;
  let next = null;

  for (let i=0;i<activeSchedule.length;i++){
    const p = activeSchedule[i];
    const s = parseHHMM(p.start);
    const e = parseHHMM(p.end);
    const sM = s.getHours()*60 + s.getMinutes();
    const eM = e.getHours()*60 + e.getMinutes();

    if (nowMinutes >= sM && nowMinutes < eM){
      current = {...p, start:s, end:e};
      next = (i+1 < activeSchedule.length) ? activeSchedule[i+1] : null;
      break;
    }
    if (nowMinutes < sM){
      next = p;
      break;
    }
  }

  // after school
  if (!current && !next){
    periodInfo.textContent = "School's Out!";
    progressBar.style.width = "100%";
    progressBar.style.background = "#6a0d15";
    barText.textContent = "School's Out!";
    bathroomBadge.hidden = true;
    return;
  }

  // passing period
  if (!current && next){
    periodInfo.textContent = "Passing Period";
    const diffSec = Math.max(0, Math.floor((parseHHMM(next.start) - now)/1000));
    barText.textContent = formatMMSS(diffSec);
    progressBar.style.width = "0%";
    progressBar.style.background = "#9ca3af";
    bathroomBadge.hidden = true;
    return;
  }

  // during class
  if (current){
    const totalSec = Math.max(1, Math.floor((current.end - current.start)/1000));
    const remainingSec = Math.max(0, Math.floor((current.end - now)/1000));
    const elapsedSec = Math.max(0, Math.floor((now - current.start)/1000));
    const percent = Math.max(0, Math.min(100, (elapsedSec / totalSec) * 100));

    progressBar.style.width = percent + "%";
    periodInfo.textContent = current.name;

    const timeText = formatMMSS(remainingSec);

    if (elapsedSec <= 15*60 || remainingSec <= 15*60){
      // restriction
      progressBar.style.background = "var(--red)";
      barText.textContent = `No Bathroom or Passes — ${timeText}`;
      bathroomBadge.hidden = false;
      bathroomBadge.textContent = `No Bathroom or Passes — ${timeText}`;
    } else {
      // normal
      progressBar.style.background = "var(--green)";
      barText.textContent = timeText;
      bathroomBadge.hidden = true;
    }
    return;
  }
}

setInterval(updateClockAndSchedule, 500);
updateClockAndSchedule();

/* ===========
   Class timer (student + teacher controls)
   =========== */
function updateClassTimerUI(){
  classCount.textContent = formatMMSS(classTimerRemaining);
  if (classTimerRemaining <= 0 && classTimerTotal > 0){
    classCount.classList.add("flash");
    if (alarmEnabled) playAlarm();
    stopClassTimer();
  } else {
    classCount.classList.remove("flash");
  }
}
function tickClassTimer(){
  if (!classTimerRunning) return;
  classTimerRemaining = Math.max(0, classTimerRemaining - 1);
  updateClassTimerUI();
}
function startClassTimer(){
  if (classTimerTotal <= 0) return;
  initAudio();
  if (!classTimerRunning){
    classTimerRunning = true;
    classIntv = setInterval(tickClassTimer, 1000);
  }
}
function stopClassTimer(){
  classTimerRunning = false;
  if (classIntv){ clearInterval(classIntv); classIntv = null; }
}
function resetClassTimer(){
  stopClassTimer();
  classTimerRemaining = classTimerTotal;
  updateClassTimerUI();
}

// play alarm using WebAudio
function playAlarm(){
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(alarmGain, audioCtx.currentTime + 0.02);
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 2);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2);
    setTimeout(()=>{ try{ o.stop(); }catch(e){} }, 2100);
  } catch (e){ console.warn("alarm play error", e); }
}

/* student presets */
studentPresets.forEach(btn => {
  btn.addEventListener("click", () => {
    const sec = parseInt(btn.dataset.sec, 10) || 0;
    classTimerTotal = sec; classTimerRemaining = sec; updateClassTimerUI();
  });
});

/* student custom set */
setCustomBtn.addEventListener("click", () => {
  const m = Math.max(0, parseInt(customMin.value, 10) || 0);
  const s = Math.max(0, parseInt(customSec.value, 10) || 0);
  classTimerTotal = m*60 + s; classTimerRemaining = classTimerTotal; updateClassTimerUI();
});

/* student controls */
startBtn.addEventListener("click", () => { initAudio(); startClassTimer(); });
pauseBtn.addEventListener("click", () => { stopClassTimer(); });
resetBtn.addEventListener("click", () => { resetClassTimer(); });

/* teacher quick presets */
teacherPresets.forEach(b => {
  b.addEventListener("click", ()=> {
    const sec = parseInt(b.dataset.sec, 10) || 0;
    classTimerTotal = sec; classTimerRemaining = sec; updateClassTimerUI(); startClassTimer();
  });
});

/* teacher custom set & start */
teachSet.addEventListener("click", ()=> {
  const m = Math.max(0, parseInt(teachMin.value, 10) || 0);
  const s = Math.max(0, parseInt(teachSec.value, 10) || 0);
  classTimerTotal = m*60 + s; classTimerRemaining = classTimerTotal; updateClassTimerUI(); startClassTimer();
});

/* alarm toggle & volume */
alarmToggle.addEventListener("change", ()=> { alarmEnabled = (alarmToggle.value === "on"); });
alarmVolume.addEventListener("input", ()=> { alarmGain = parseFloat(alarmVolume.value); });

/* ===========
   Teacher panel & fullscreen
   =========== */
// open/close teacher panel
teacherBtn.addEventListener("click", ()=> {
  const open = teacherPanel.classList.toggle("open");
  teacherBtn.setAttribute("aria-expanded", String(open));
  teacherPanel.setAttribute("aria-hidden", String(!open));
});
if (closePanelBtn) {
  closePanelBtn.addEventListener("click", ()=> {
    teacherPanel.classList.remove("open");
    teacherBtn.setAttribute("aria-expanded","false");
    teacherPanel.setAttribute("aria-hidden","true");
  });
}
// close when clicking outside
document.addEventListener("click", (e) => {
  if (!teacherPanel.classList.contains("open")) return;
  if (teacherPanel.contains(e.target) || teacherBtn.contains(e.target)) return;
  teacherPanel.classList.remove("open");
  teacherBtn.setAttribute("aria-expanded","false");
  teacherPanel.setAttribute("aria-hidden","true");
});

// fullscreen toggle
if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async ()=> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        fullscreenBtn.textContent = "Exit Fullscreen";
      } else {
        await document.exitFullscreen();
        fullscreenBtn.textContent = "Enter Fullscreen";
      }
    } catch (e) { console.warn("Fullscreen error", e); }
  });
}

/* Unlock audio on first user gesture to satisfy autoplay policies */
["click","touchstart"].forEach(evt => {
  window.addEventListener(evt, function once(){
    initAudio();
    window.removeEventListener(evt, once);
  }, { once:true });
});

/* initialize */
updateClassTimerUI();
updateClockAndSchedule();
