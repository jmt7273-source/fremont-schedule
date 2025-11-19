// Schedules as before
const schedules = {
  regular: [
    { name: "Period 1", start: "08:30", end: "09:38" },
    { name: "Period 2", start: "09:44", end: "10:41" },
    { name: "Period 3", start: "10:47", end: "11:44" },
    { name: "Lunch", start: "11:44", end: "12:14" },
    { name: "Period 4", start: "12:20", end: "13:17" },
    { name: "Period 5", start: "13:23", end: "14:20" },
    { name: "Period 6", start: "14:26", end: "15:23" },
  ],
  tuesday: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:21" },
    { name: "Period 3", start: "10:27", end: "11:14" },
    { name: "Lunch", start: "11:14", end: "11:44" },
    { name: "Period 4", start: "11:50", end: "12:37" },
    { name: "Period 5", start: "12:43", end: "13:30" },
    { name: "Period 6", start: "13:36", end: "14:23" },
  ],
  minimum: [
    { name: "Period 1", start: "08:30", end: "09:18" },
    { name: "Period 2", start: "09:24", end: "09:59" },
    { name: "Period 3", start: "10:05", end: "10:40" },
    { name: "Lunch", start: "10:40", end: "11:10" },
    { name: "Period 4", start: "11:16", end: "11:51" },
    { name: "Period 5", start: "11:57", end: "12:32" },
    { name: "Period 6", start: "12:38", end: "13:13" },
  ],
  shortened: [
    { name: "Period 1", start: "08:30", end: "09:28" },
    { name: "Period 2", start: "09:34", end: "10:20" },
    { name: "Period 3", start: "10:26", end: "11:12" },
    { name: "Lunch", start: "11:12", end: "11:42" },
    { name: "Period 4", start: "11:48", end: "12:34" },
    { name: "Period 5", start: "12:40", end: "13:26" },
    { name: "Period 6", start: "13:32", end: "14:18" },
  ],
};

function parseTimeToDate(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  return now;
}

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

let currentScheduleKey = "auto";
let currentSchedule = [];
let countdownInterval;
let alarmInterval;
let alarmTimeLeft = 0;

let testTime = null; // simulated time or null for live

const scheduleSelect = document.getElementById("scheduleSelect");
const countdownBar = document.getElementById("countdownBar");
const countdownText = document.getElementById("countdownText");
const elapsedTimeText = document.getElementById("elapsedTimeText");
const passingPeriodText = document.getElementById("passingPeriodText");

const alarmDurationSelect = document.getElementById("alarmDurationSelect");
const customAlarmInputs = document.getElementById("customAlarmInputs");
const customAlarmMinutes = document.getElementById("customAlarmMinutes");
const customAlarmSeconds = document.getElementById("customAlarmSeconds");
const startAlarmBtn = document.getElementById("startAlarmBtn");
const alarmTimerDisplay = document.getElementById("alarmTimerDisplay");
const alarmSound = document.getElementById("alarmSound");

const darkModeBtn = document.getElementById("darkModeToggle");

const sessionSummary = document.getElementById("sessionSummary");
const closeSummaryBtn = document.getElementById("closeSummaryBtn");

const schoolLogo = document.getElementById("schoolLogo");

const periodSoundsToggle = document.getElementById("periodSoundsToggle");

const adminPanel = document.getElementById("adminPanel");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");

// Dark Mode Setup
function setDarkMode(enabled) {
  if (enabled) {
    document.documentElement.setAttribute("data-theme", "dark");
    darkModeBtn.textContent = "☀️";
  } else {
    document.documentElement.removeAttribute("data-theme");
    darkModeBtn.textContent = "🌙";
  }
  localStorage.setItem("darkMode", enabled ? "true" : "false");
}

darkModeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setDarkMode(!isDark);
});

if (localStorage.getItem("darkMode") === "true") {
  setDarkMode(true);
} else {
  setDarkMode(false);
}


function getTodayScheduleKey() {
  const today = testTime !== null ? new Date(testTime) : new Date();
  if (today.getDay() === 2) return "tuesday";
  return "regular";
}

function updateSchedule() {
  if (currentScheduleKey === "auto") {
    currentSchedule = schedules[getTodayScheduleKey()];
  } else {
    currentSchedule = schedules[currentScheduleKey];
  }
}

function updateCountdown() {
  const now = testTime !== null ? new Date(testTime) : new Date();
  let currentPeriodIndex = -1;
  let inPeriod = false;

  for (let i = 0; i < currentSchedule.length; i++) {
    const period = currentSchedule[i];
    const start = parseTimeToDate(period.start);
    const end = parseTimeToDate(period.end);
    if (now >= start && now <= end) {
      currentPeriodIndex = i;
      inPeriod = true;
      break;
    }
    if (now > end && i < currentSchedule.length - 1) {
      const nextStart = parseTimeToDate(currentSchedule[i + 1].start);
      if (now < nextStart) {
        currentPeriodIndex = i;
        inPeriod = false;
        break;
      }
    }
  }

  if (currentPeriodIndex === -1) {
    countdownBar.style.backgroundColor = "var(--grey)";
    countdownBar.style.width = "100%";
    countdownBar.classList.remove("pulsing");
    countdownText.textContent = "No active periods now";
    elapsedTimeText.textContent = "";
    passingPeriodText.textContent = "";
    lastPeriodName = null;
    lastIsInPeriod = null;
    return;
  }

  if (inPeriod) {
    const period = currentSchedule[currentPeriodIndex];
    const start = parseTimeToDate(period.start);
    const end = parseTimeToDate(period.end);
    const elapsed = (now.getTime() - start.getTime()) / 1000;
    const total = (end.getTime() - start.getTime()) / 1000;
    const remaining = (end.getTime() - now.getTime()) / 1000;

    const redThreshold = 15 * 60;
    const percentage = ((total - remaining) / total) * 100;
    countdownBar.style.width = percentage + "%";

    if (elapsed < redThreshold) {
      countdownBar.style.backgroundColor = "var(--red)";
      countdownBar.classList.add("pulsing");
      countdownText.textContent = "[translate:No Bathroom or Passes] - " + Math.ceil((redThreshold - elapsed) / 60) + " min";
    } else if (remaining < redThreshold) {
      countdownBar.style.backgroundColor = "var(--red)";
      countdownBar.classList.add("pulsing");
      countdownText.textContent = "[translate:No Bathroom or Passes] - " + Math.ceil(remaining / 60) + " min";
    } else {
      countdownBar.style.backgroundColor = "var(--green)";
      countdownBar.classList.remove("pulsing");
      countdownText.textContent = period.name + ": " + formatTime(remaining);
    }
    elapsedTimeText.textContent = `Elapsed: ${formatTime(elapsed)} / ${formatTime(total)}`;
    passingPeriodText.textContent = "";
    handlePeriodChange(period.name, true);
  } else {
    const period = currentSchedule[currentPeriodIndex];
    const nextPeriod = currentSchedule[currentPeriodIndex + 1];
    const nextStart = parseTimeToDate(nextPeriod.start);
    const remaining = (nextStart.getTime() - now.getTime()) / 1000;

    countdownBar.style.backgroundColor = "var(--grey)";
    countdownBar.style.width = "100%";
    countdownBar.classList.remove("pulsing");
    countdownText.textContent = "[translate:Passing Period]";
    elapsedTimeText.textContent = "";
    passingPeriodText.textContent = "Time left until " + nextPeriod.name + ": " + formatTime(remaining);
    handlePeriodChange(nextPeriod.name, false);
  }

  checkSessionSummary();
}

let lastPeriodName = null;
let lastIsInPeriod = null;

function handlePeriodChange(name, isInPeriod) {
  if (periodSoundsToggle.checked) {
    if (name !== lastPeriodName || isInPeriod !== lastIsInPeriod) {
      playPeriodChime();
      lastPeriodName = name;
      lastIsInPeriod = isInPeriod;
    }
  }
}

function playPeriodChime() {
  const chime = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
  chime.play().catch(() => {});
}

// Alarm timer 
function updateAlarmDisplay(secondsLeft) {
  alarmTimerDisplay.textContent = formatTime(secondsLeft);
}

function startAlarmCountdown(duration) {
  alarmTimeLeft = duration;
  updateAlarmDisplay(alarmTimeLeft);

  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    alarmTimeLeft--;
    updateAlarmDisplay(alarmTimeLeft);
    if (alarmTimeLeft <= 0) {
      clearInterval(alarmInterval);
      alarmTimerDisplay.textContent = "00:00";
      alarmSound.play();
    }
  }, 1000);
}

// Session summary
const sessionSummary = document.getElementById("sessionSummary");
function checkSessionSummary() {
  if (!currentSchedule.length) return;
  const now = testTime !== null ? new Date(testTime) : new Date();
  const lastPeriod = currentSchedule[currentSchedule.length - 1];
  const end = parseTimeToDate(lastPeriod.end);

  if (now > end) {
    sessionSummary.hidden = false;
  } else {
    sessionSummary.hidden = true;
  }
}
document.getElementById("closeSummaryBtn").addEventListener("click", () => {
  sessionSummary.hidden = true;
});

// Resize Canva frame
function resizeCanvaFrame() {
  const header = document.querySelector('header');
  const countdownSection = document.getElementById('countdownSection');
  const canvaFrame = document.getElementById('canvaFrame');

  const headerHeight = header.offsetHeight;
  const countdownHeight = countdownSection.offsetHeight;
  const chrome = 32; 

  const height =
    window.innerHeight - headerHeight - countdownHeight - chrome;

  canvaFrame.style.height = height > 200 ? `${height}px` : "200px";
}

// Elements for test mode
const testHour = document.getElementById("testHour");
const testMinute = document.getElementById("testMinute");
const setTestTimeBtn = document.getElementById("setTestTimeBtn");
const clearTestTimeBtn = document.getElementById("clearTestTimeBtn");

// Event listeners
scheduleSelect.addEventListener("change", () => {
  currentScheduleKey = scheduleSelect.value;
  updateSchedule();
  updateCountdown();
});

alarmDurationSelect.addEventListener("change", () => {
  if (alarmDurationSelect.value === "custom") {
    customAlarmInputs.style.display = "inline-flex";
  } else {
    customAlarmInputs.style.display = "none";
  }
});

startAlarmBtn.addEventListener("click", () => {
  let duration;
  if (alarmDurationSelect.value === "custom") {
    const min = parseInt(customAlarmMinutes.value, 10) || 0;
    const sec = parseInt(customAlarmSeconds.value, 10) || 0;
    duration = min * 60 + sec;
    if (duration < 1) {
      alert("Please enter a valid custom time of at least 1 second.");
      return;
    }
  } else {
    duration = parseInt(alarmDurationSelect.value, 10);
  }
  startAlarmCountdown(duration);
});

setTestTimeBtn.addEventListener("click", () => {
  const hour = parseInt(testHour.value, 10);
  const minute = parseInt(testMinute.value, 10);
  if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
    alert("Enter valid hour (0-23) and minute (0-59).");
    return;
  }
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  testTime = now;
  updateCountdown();
});

clearTestTimeBtn.addEventListener("click", () => {
  testTime = null;
  updateCountdown();
});

schoolLogo.addEventListener("dblclick", () => {
  adminPanel.hidden = !adminPanel.hidden;
});

resetTimerBtn.addEventListener("click", () => {
  updateSchedule();
  updateCountdown();
});

closeAdminBtn.addEventListener("click", () => {
  adminPanel.hidden = true;
});

window.addEventListener('resize', resizeCanvaFrame);

window.addEventListener('DOMContentLoaded', () => {
  updateSchedule();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  resizeCanvaFrame();
});
