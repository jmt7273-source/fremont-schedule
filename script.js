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
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const timerLabel = document.getElementById("timer-label");

let timer = null;
let timerDuration = 0;
let timerRemaining = 0;
let scheduleMode = "auto";

// Teacher panel toggle
teacherBtn.addEventListener("click", () => {
  const expanded = teacherBtn.getAttribute("aria-expanded") === "true";
  teacherBtn.setAttribute("aria-expanded", String(!expanded));
  teacherPanel.setAttribute("aria-hidden", String(expanded));
  teacherPanel.classList.toggle("open");
});

// Schedule override
overrideSelect.addEventListener("change", () => {
  scheduleMode = overrideSelect.value;
  updateSchedule();
});

// Quick presets
quickPresets.forEach(btn => {
  btn.addEventListener("click", () => {
    const seconds = parseInt(btn.dataset.sec, 10);
    startTimer(seconds);
  });
});

// Custom timer
teachGoBtn.addEventListener("click", () => {
  const min = parseInt(teachMinInput.value, 10) || 0;
  const sec = parseInt(teachSecInput.value, 10) || 0;
  startTimer(min * 60 + sec);
});

// Timer control buttons
startBtn.addEventListener("click", () => resumeTimer());
pauseBtn.addEventListener("click", () => pauseTimer());
resetBtn.addEventListener("click", () => resetTimer());

// Timer logic
function startTimer(seconds) {
  if (timer) clearInterval(timer);
  timerDuration = timerRemaining = seconds;
  renderTimer();
  timer = setInterval(() => {
    if (timerRemaining > 0) {
      timerRemaining--;
      renderTimer();
    } else {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

function resumeTimer() {
  if (timer || timerRemaining <= 0) return;
  timer = setInterval(() => {
    if (timerRemaining > 0) {
      timerRemaining--;
      renderTimer();
    } else {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

function pauseTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function resetTimer() {
  timerRemaining = timerDuration;
  renderTimer();
}

function renderTimer() {
  const min = Math.floor(timerRemaining / 60).toString().padStart(2, "0");
  const sec = (timerRemaining % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${min}:${sec}`;
  progressFill.style.width = timerDuration ? `${((timerDuration - timerRemaining)/timerDuration) * 100}%` : "0%";
}

// Schedule logic
function updateSchedule() {
  let today = new Date();
  let schedule;
  if (scheduleMode === "regular" || scheduleMode === "tuesdayPD" || scheduleMode === "minimum" || scheduleMode === "shortened") {
    schedule = SCHEDULES[scheduleMode];
  } else {
    // Auto: use day of week
    if (today.getDay() === 2) {
      schedule = SCHEDULES.tuesdayPD;
    } else {
      schedule = SCHEDULES.regular;
    }
  }
  // You can use `schedule` as needed—render it in UI, etc.
}

// INIT
updateSchedule();
