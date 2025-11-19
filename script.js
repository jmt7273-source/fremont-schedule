// SCHEDULE CONFIGURATION
const SCHEDULES = {
  regular: [
    { name: "Period 1", start: "08:30", end: "09:38" },
    { name: "Period 2", start: "09:44", end: "10:41" },
    { name: "Period 3", start: "10:47", end: "11:44" },
    { name: "Lunch", start: "11:44", end: "12:14" },
    { name: "Period 4", start: "12:20", end: "13:17" },
    { name: "Period 5", start: "13:23", end: "14:20" },
    { name: "Period 6", start: "14:26", end: "15:23" }
  ],
  tuesdayPD: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:21" },
    { name: "Period 3", start: "10:27", end: "11:14" },
    { name: "Lunch", start: "11:14", end: "11:44" },
    { name: "Period 4", start: "11:50", end: "12:37" },
    { name: "Period 5", start: "12:43", end: "13:30" },
    { name: "Period 6", start: "13:36", end: "14:23" }
  ],
  minimum: [
    { name: "Period 1", start: "08:30", end: "09:18" },
    { name: "Period 2", start: "09:24", end: "09:59" },
    { name: "Period 3", start: "10:05", end: "10:40" },
    { name: "Lunch", start: "10:40", end: "11:10" },
    { name: "Period 4", start: "11:16", end: "11:51" },
    { name: "Period 5", start: "11:57", end: "12:32" },
    { name: "Period 6", start: "12:38", end: "13:13" }
  ],
  shortened: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:20" },
    { name: "Period 3", start: "10:26", end: "11:12" },
    { name: "Lunch", start: "11:12", end: "11:42" },
    { name: "Period 4", start: "11:48", end: "12:34" },
    { name: "Period 5", start: "12:40", end: "13:26" },
    { name: "Period 6", start: "13:32", end: "14:18" }
  ]
};

const teacherBtn = document.getElementById("teacher-btn");
const teacherPanel = document.getElementById("teacher-panel");
const overrideSelect = document.getElementById("override-select");
const quickPresets = document.querySelectorAll(".preset");
const teachMinInput = document.getElementById("teach-min");
const teachSecInput = document.getElementById("teach-sec");
const teachGoBtn = document.getElementById("teach-go");
const musicToggle = document.getElementById("music-toggle");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const warningText = document.getElementById("warning-text");
const timerLabel = document.getElementById("timer-label");
const alarmTimer = document.getElementById("alarm-timer");
const alarmSound = document.getElementById('alarm-sound');

let timer = null;
let timerDuration = 300; // seconds
let timerRemaining = 300;

let alarmTimerCountdown = 0;
let alarmTimerInterval = null;

let scheduleMode = "auto";
let currentSchedule = null;
let currentPeriod = null;

// Helper: Parse time string HH:MM to Date object today
function parseTimeHM(hm) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// Helper: Get current period based on schedule and current time
function getCurrentPeriod(schedule) {
  const now = new Date();
  for (const period of schedule) {
    const start = parseTimeHM(period.start);
    const end = parseTimeHM(period.end);
    if (now >= start && now < end) {
      return {...period, startTime: start, endTime: end};
    }
  }
  return null;
}

// Update schedule based on day or override select
function updateSchedule() {
  if (scheduleMode === "regular" || scheduleMode === "tuesdayPD" || scheduleMode === "minimum" || scheduleMode === "shortened") {
    currentSchedule = SCHEDULES[scheduleMode];
  } else if (scheduleMode === "auto") {
    if ((new Date()).getDay() === 2) { // Tuesday
      currentSchedule = SCHEDULES.tuesdayPD;
    } else {
      currentSchedule = SCHEDULES.regular;
    }
  }
}

function secondsBetween(date1, date2) {
  return Math.floor((date2 - date1) / 1000);
}

function updateCurrentPeriod() {
  currentPeriod = getCurrentPeriod(currentSchedule);
  if (!currentPeriod) {
    timerLabel.textContent = "No Current Period";
    timerDisplay.textContent = "--:--";
    progressFill.style.width = "0%";
    progressFill.style.backgroundColor = "var(--green)";
    progressText.textContent = "";
    warningText.textContent = "";
    return false;
  }
  timerLabel.textContent = currentPeriod.name;
  return true;
}

// Update countdown based on period time
function updateCountdown() {
  if (!currentPeriod) return;
  const now = new Date();
  const secondsLeft = secondsBetween(now, currentPeriod.endTime);
  const totalSeconds = secondsBetween(currentPeriod.startTime, currentPeriod.endTime);

  timerDuration = totalSeconds;
  timerRemaining = secondsLeft;

  // Format minutes:seconds
  const mins = Math.floor(timerRemaining / 60);
  const secs = timerRemaining % 60;
  timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress bar width
  const progressPercent = ((timerDuration - timerRemaining) / timerDuration) * 100;
  progressFill.style.width = `${progressPercent}%`;

  // Alert first and last 15 minutes: change bar color and show warning text
  if (timerRemaining <= 15 * 60 || timerRemaining >= timerDuration - 15 * 60) {
    progressFill.style.backgroundColor = "var(--red)";
    let warningMinutesLeft;
    if (timerRemaining <= 15 * 60) {
      warningMinutesLeft = Math.ceil(timerRemaining / 60);
      warningText.textContent = `No Bathroom or Passes - ${warningMinutesLeft} min Left`;
    } else {
      warningMinutesLeft = Math.ceil((timerDuration - timerRemaining) / 60);
      warningText.textContent = `No Bathroom or Passes - ${warningMinutesLeft} min Passed`;
    }
    // Show text centered inside progress bar too
    progressText.textContent = warningText.textContent;
  } else {
    progressFill.style.backgroundColor = "var(--green)";
    warningText.textContent = "";
    progressText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

// Main periodic update to refresh timer
function periodicUpdate() {
  if (!updateCurrentPeriod()) return;
  updateCountdown();
}

// Teacher panel toggle
teacherBtn.addEventListener("click", () => {
  const expanded = teacherBtn.getAttribute("aria-expanded") === "true";
  teacherBtn.setAttribute("aria-expanded", String(!expanded));
  teacherPanel.setAttribute("aria-hidden", String(expanded));
  teacherPanel.classList.toggle("open");
});

// Schedule override change event
overrideSelect.addEventListener("change", () => {
  scheduleMode = overrideSelect.value;
  updateSchedule();
  periodicUpdate();
});

// Quick preset timers
quickPresets.forEach(btn => {
  btn.addEventListener("click", () => {
    const seconds = parseInt(btn.dataset.sec, 10);
    startVisualTimer(seconds);
  });
});

// Custom timer start
teachGoBtn.addEventListener("click", () => {
  const min = parseInt(teachMinInput.value, 10) || 0;
  const sec = parseInt(teachSecInput.value, 10) || 0;
  startVisualTimer(min * 60 + sec);
});

// Visual timer buttons
startBtn.addEventListener("click", () => resumeVisualTimer());
pauseBtn.addEventListener("click", () => pauseVisualTimer());
resetBtn.addEventListener("click", () => resetVisualTimer());

// Visual timer variables and functions (upper right corner timer with alarm)
let visualTimerInterval = null;
let visualTimerRemaining = 0;

function startVisualTimer(seconds) {
  if (visualTimerInterval) clearInterval(visualTimerInterval);
  visualTimerRemaining = seconds;
  updateVisualTimerDisplay();
  visualTimerInterval = setInterval(() => {
    if (visualTimerRemaining > 0) {
      visualTimerRemaining--;
      updateVisualTimerDisplay();
    } else {
      clearInterval(visualTimerInterval);
      visualTimerInterval = null;
      playAlarm();
    }
  }, 1000);
}

function resumeVisualTimer() {
  if (visualTimerInterval || visualTimerRemaining <= 0) return;
  visualTimerInterval = setInterval(() => {
    if (visualTimerRemaining > 0) {
      visualTimerRemaining--;
      updateVisualTimerDisplay();
    } else {
      clearInterval(visualTimerInterval);
      visualTimerInterval = null;
      playAlarm();
    }
  }, 1000);
}

function pauseVisualTimer() {
  if (visualTimerInterval) clearInterval(visualTimerInterval);
  visualTimerInterval = null;
}

function resetVisualTimer() {
  if (visualTimerInterval) clearInterval(visualTimerInterval);
  visualTimerRemaining = 0;
  updateVisualTimerDisplay();
}

function updateVisualTimerDisplay() {
  const min = Math.floor(visualTimerRemaining / 60);
  const sec = visualTimerRemaining % 60;
  alarmTimer.textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function playAlarm() {
  if(alarmSound){
    alarmSound.play().catch(() => {}); // play and ignore errors (usually browser restrictions on autoplay)
  }
}

// Initialize on page load
updateSchedule();
periodicUpdate();
setInterval(periodicUpdate, 1000);
updateVisualTimerDisplay();
