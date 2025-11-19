// Schedules in 24-hour time as [start, end]
// Output in minutes and seconds for countdowns
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

// Parse a time string "HH:mm" into a Date object for today
function parseTimeToDate(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  return now;
}

// Calculate difference in seconds
function diffSeconds(date1, date2) {
  return (date2.getTime() - date1.getTime()) / 1000;
}

// Format seconds to mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// State variables
let currentScheduleKey = "auto";
let currentSchedule = [];
let countdownInterval;
let alarmInterval;
let alarmTimeLeft = 0;

const scheduleSelect = document.getElementById("scheduleSelect");
const countdownBar = document.getElementById("countdownBar");
const countdownText = document.getElementById("countdownText");
const passingPeriodText = document.getElementById("passingPeriodText");

const alarmDurationSelect = document.getElementById("alarmDurationSelect");
const customAlarmInput = document.getElementById("customAlarmInput");
const startAlarmBtn = document.getElementById("startAlarmBtn");
const alarmTimerDisplay = document.getElementById("alarmTimerDisplay");
const alarmSound = document.getElementById("alarmSound");

// Determine today's schedule key automatically
function getTodayScheduleKey() {
  const today = new Date();
  // Tuesday is 2 (Sunday=0)
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

// Find current period or passing period and update UI accordingly
function updateCountdown() {
  const now = new Date();
  let currentPeriodIndex = -1;
  let inPeriod = false;

  // Find which period or passing period we are in
  for (let i = 0; i < currentSchedule.length; i++) {
    const period = currentSchedule[i];
    const start = parseTimeToDate(period.start);
    const end = parseTimeToDate(period.end);
    if (now >= start && now <= end) {
      currentPeriodIndex = i;
      inPeriod = true;
      break;
    }
    if (now > end && i < currentSchedule.length -1) {
      const nextStart = parseTimeToDate(currentSchedule[i+1].start);
      if (now < nextStart) {
        currentPeriodIndex = i;
        inPeriod = false; // Passing period between periods
        break;
      }
    }
  }

  if (currentPeriodIndex === -1) {
    // Before first period or after last period
    countdownBar.style.backgroundColor = "var(--color-grey)";
    countdownText.textContent = "No active periods now";
    passingPeriodText.textContent = "";
    return;
  }

  if (inPeriod) {
    const period = currentSchedule[currentPeriodIndex];
    const start = parseTimeToDate(period.start);
    const end = parseTimeToDate(period.end);
    const elapsed = (now.getTime() - start.getTime()) / 1000;
    const total = (end.getTime() - start.getTime()) / 1000;
    const remaining = (end.getTime() - now.getTime()) / 1000;

    // Determine color and message
    const redThreshold = 15 * 60; // 15 minutes in seconds
    if (elapsed < redThreshold) {
      // First 15 minutes - red
      countdownBar.style.backgroundColor = "var(--color-red)";
      countdownText.textContent = `[translate:No Bathroom or Passes] - ${Math.ceil((redThreshold - elapsed) / 60)} min`;
    } else if (remaining < redThreshold) {
      // Last 15 minutes - red
      countdownBar.style.backgroundColor = "var(--color-red)";
      countdownText.textContent = `[translate:No Bathroom or Passes] - ${Math.ceil(remaining / 60)} min`;
    } else {
      countdownBar.style.backgroundColor = "var(--color-green)";
      countdownText.textContent = `${period.name}: ${formatTime(remaining)}`;
    }

    passingPeriodText.textContent = "";
  } else {
    // Passing period
    const period = currentSchedule[currentPeriodIndex];
    const nextPeriod = currentSchedule[currentPeriodIndex + 1];
    const periodEnd = parseTimeToDate(period.end);
    const nextStart = parseTimeToDate(nextPeriod.start);
    const remaining = (nextStart.getTime() - now.getTime()) / 1000;

    countdownBar.style.backgroundColor = "var(--color-grey)";
    countdownText.textContent = `[translate:Passing Period]`;
    passingPeriodText.textContent = `Time left until ${nextPeriod.name}: ${formatTime(remaining)}`;
  }
}

// Alarm timer functions

function updateAlarmDisplay(secondsLeft) {
  alarmTimerDisplay.textContent = formatTime(secondsLeft);
}

function startAlarmCountdown(duration) {
  alarmTimeLeft = duration;
  updateAlarmDisplay(alarmTimeLeft);

  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    alarmTimeLeft--;
    if (alarmTimeLeft <= 0) {
      clearInterval(alarmInterval);
      alarmTimerDisplay.textContent = "00:00";
      alarmSound.play();
      return;
    }
    updateAlarmDisplay(alarmTimeLeft);
  }, 1000);
}

// Event listeners

scheduleSelect.addEventListener("change", () => {
  currentScheduleKey = scheduleSelect.value;
  updateSchedule();
  updateCountdown();
});

alarmDurationSelect.addEventListener("change", () => {
  if (alarmDurationSelect.value === "custom") {
    customAlarmInput.style.display = "inline-block";
  } else {
    customAlarmInput.style.display = "none";
  }
});

startAlarmBtn.addEventListener("click", () => {
  let duration;
  if (alarmDurationSelect.value === "custom") {
    const val = parseInt(customAlarmInput.value, 10);
    if (isNaN(val) || val < 1) {
      alert("Please enter a valid custom time in seconds.");
      return;
    }
    duration = val;
  } else {
    duration = parseInt(alarmDurationSelect.value, 10);
  }
  startAlarmCountdown(duration);
});

// Initial setup
currentScheduleKey = "auto";
updateSchedule();
updateCountdown();
setInterval(updateCountdown, 1000);
