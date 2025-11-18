// -------------------------
// SCHEDULES
// -------------------------
const SCHEDULES = {
  regular: [
    { name:"Period 1", start:"08:30", end:"09:38" },
    { name:"Period 2", start:"09:44", end:"10:41" },
    { name:"Period 3", start:"10:47", end:"11:44" },
    { name:"Lunch",    start:"11:44", end:"12:14" },
    { name:"Period 4", start:"12:20", end:"13:17" },
    { name:"Period 5", start:"13:23", end:"14:20" },
    { name:"Period 6", start:"14:26", end:"15:23" }
  ],
  tuesdayPD: [
    { name:"Period 1", start:"08:30", end:"09:28" },
    { name:"Period 2", start:"09:34", end:"10:21" },
    { name:"Period 3", start:"10:27", end:"11:14" },
    { name:"Lunch",    start:"11:14", end:"11:44" },
    { name:"Period 4", start:"11:50", end:"12:37" },
    { name:"Period 5", start:"12:43", end:"13:30" },
    { name:"Period 6", start:"13:36", end:"14:23" }
  ],
  minimum: [
    { name:"Period 1", start:"08:30", end:"09:18" },
    { name:"Period 2", start:"09:24", end:"09:59" },
    { name:"Period 3", start:"10:05", end:"10:40" },
    { name:"Lunch",    start:"10:40", end:"11:10" },
    { name:"Period 4", start:"11:16", end:"11:51" },
    { name:"Period 5", start:"11:57", end:"12:32" },
    { name:"Period 6", start:"12:38", end:"13:13" }
  ],
  shortened:[
    { name:"Period 1", start:"08:30", end:"09:28" },
    { name:"Period 2", start:"09:34", end:"10:20" },
    { name:"Period 3", start:"10:26", end:"11:12" },
    { name:"Lunch",    start:"11:12", end:"11:42" },
    { name:"Period 4", start:"11:48", end:"12:34" },
    { name:"Period 5", start:"12:40", end:"13:26" },
    { name:"Period 6", start:"13:32", end:"14:18" }
  ]
};

// -------------------------
// DOM Elements
// -------------------------
const scheduleSelect = document.getElementById("schedule-select");
const progressBar = document.getElementById("progress-bar");
const barText = document.getElementById("bar-text");
const periodInfo = document.getElementById("period-info");
const liveClockEl = document.getElementById("live-clock");

// CLASS TIMER elements
const presets = Array.from(document.querySelectorAll(".preset"));
const customMin = document.getElementById("custom-min");
const customSec = document.getElementById("custom-sec");
const setCustomBtn = document.getElementById("set-custom");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const classCount = document.getElementById("class-count");

// -------------------------
// SCHEDULE MODE
// -------------------------
let scheduleMode = "auto";       // auto | regular | tuesdayPD | minimum | shortened
let activeSchedule = SCHEDULES.regular;

// auto choose based on day
function autoSchedule() {
  const today = new Date().getDay();
  return today === 2 ? SCHEDULES.tuesdayPD : SCHEDULES.regular;
}

// update activeSchedule when dropdown changes
scheduleSelect.addEventListener("change", () => {
  scheduleMode = scheduleSelect.value;

  if (scheduleMode === "auto") {
    activeSchedule = autoSchedule();
  } else {
    activeSchedule = SCHEDULES[scheduleMode];
  }
});

// -------------------------
// Helpers
// -------------------------
function parseToday(timeHHMM){
  const [hh,mm] = timeHHMM.split(":").map(Number);
  const d = new Date();
  d.setHours(hh,mm,0,0);
  return d;
}

// -------------------------
// MAIN CLOCK / SCHEDULE LOOP
// -------------------------
function updateMainClockAndSchedule(){
  const now = new Date();
  liveClockEl.textContent = now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});

  // update schedule if in Auto mode
  if (scheduleMode === "auto") {
    activeSchedule = autoSchedule();
  }

  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;

  let current=null, next=null;

  for (let i=0; i<activeSchedule.length; i++){
    const p = activeSchedule[i];
    const s = parseToday(p.start);
    const e = parseToday(p.end);
    const sM = s.getHours()*60 + s.getMinutes();
    const eM = e.getHours()*60 + e.getMinutes();

    if (nowMin >= sM && nowMin < eM){
      current = {...p, start:s, end:e};
      next = activeSchedule[i+1] || null;
      break;
    }
    if (nowMin < sM){
      next = p;
      break;
    }
  }

  // After school
  if (!current && !next){
    progressBar.style.width = "100%";
    progressBar.style.background = "#6a0d15";
    barText.textContent = "School's Out!";
    periodInfo.textContent = "School's Out!";
    return;
  }

  // Passing period
  if (!current && next){
    const nextStart = parseToday(next.start);
    let diff = Math.max(0, Math.floor((nextStart - now)/1000));
    let mm = Math.floor(diff/60);
    let ss = diff % 60;
    barText.textContent = `${mm}:${String(ss).padStart(2,"0")}`;
    progressBar.style.width ="0%";
    progressBar.style.background="#9ca3af";
    periodInfo.textContent = "Passing Period";
    return;
  }

  // In class
  if (current){
    const total = (current.end - current.start)/1000;
    const remaining = Math.max(0, Math.floor((current.end - now)/1000));
    const elapsed = Math.max(0, Math.floor((now - current.start)/1000));
    const percent = Math.max(0, Math.min(100, (elapsed/total)*100));

    progressBar.style.width = percent + "%";

    const mm = Math.floor(remaining/60);
    const ss = remaining % 60;
    const timeText = `${mm}:${String(ss).padStart(2,"0")}`;

    periodInfo.textContent = current.name;

    // red zone 1st 15 and last 15
    if (elapsed <= 900 || remaining <= 900){
      progressBar.style.background = "#ef4444";
      barText.textContent = `No Bathroom or Passes — ${timeText}`;
    } else {
      progressBar.style.background = "#16a34a";
      barText.textContent = timeText;
    }
  }
}

setInterval(updateMainClockAndSchedule, 500);
updateMainClockAndSchedule();

// -------------------------
// CLASS TIMER
// -------------------------
let classTimerTotal = 0;
let classTimerRemaining = 0;
let classRunning = false;
let intv = null;

// safe audio context
let audioCtx = null;
function initAudio(){
  if (!audioCtx){
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }catch(e){ console.warn("Audio init failed", e); }
  }
}

// alarm sound
function playAlarm(){
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  gain.gain.value = 0.2;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();

  // 2 second downward chirp
  osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 2);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2);

  osc.stop(audioCtx.currentTime + 2.1);
}

function fmt(sec){
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function updateClassTimerUI(){
  classCount.textContent = fmt(classTimerRemaining);

  if (classTimerRemaining <= 0 && classTimerTotal > 0){
    classCount.classList.add("flash");
    playAlarm();
    stopClassTimer();
  } else {
    classCount.classList.remove("flash");
  }
}

function tick(){
  if (!classRunning) return;
  classTimerRemaining = Math.max(0, classTimerRemaining-1);
  updateClassTimerUI();
}

function startClassTimer(){
  initAudio(); // ensures audio unlock on click
  if (classTimerTotal <= 0) return;
  if (!classRunning){
    classRunning = true;
    intv = setInterval(tick, 1000);
  }
}

function stopClassTimer(){
  classRunning = false;
  clearInterval(intv);
}

function resetClassTimer(){
  stopClassTimer();
  classTimerRemaining = classTimerTotal;
  updateClassTimerUI();
}

// PRESETS
presets.forEach(btn=>{
  btn.addEventListener("click",()=>{
    const sec = parseInt(btn.dataset.sec);
    classTimerTotal = sec;
    classTimerRemaining = sec;
    updateClassTimerUI();
  });
});

// CUSTOM
setCustomBtn.addEventListener("click",()=>{
  const m = Math.max(0, parseInt(customMin.value)||0);
  const s = Math.max(0, parseInt(customSec.value)||0);
  classTimerTotal = m*60 + s;
  classTimerRemaining = classTimerTotal;
  updateClassTimerUI();
});

// BUTTONS
startBtn.addEventListener("click", startClassTimer);
pauseBtn.addEventListener("click", stopClassTimer);
resetBtn.addEventListener("click", resetClassTimer);

// initialize display
updateClassTimerUI();
