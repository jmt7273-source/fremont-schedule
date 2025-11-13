const progressBar = document.getElementById("progress-bar");
const messageEl = document.getElementById("message");
const countdownEl = document.getElementById("countdown");
const periodInfo = document.getElementById("period-info");
const scheduleSelect = document.getElementById("scheduleSelect");

const schedules = {
  regular: [
    ["Period 1", "8:30", "9:38"],
    ["Period 2", "9:44", "10:41"],
    ["Period 3", "10:47", "11:44"],
    ["Lunch", "11:44", "12:14"],
    ["Period 4", "12:20", "13:17"],
    ["Period 5", "13:23", "14:20"],
    ["Period 6", "14:26", "15:23"],
  ],
  tuesday: [
    ["Period 1", "8:30", "9:28"],
    ["Period 2", "9:34", "10:21"],
    ["Period 3", "10:27", "11:14"],
    ["Lunch", "11:14", "11:44"],
    ["Period 4", "11:50", "12:37"],
    ["Period 5", "12:43", "13:30"],
    ["Period 6", "13:36", "14:23"],
  ],
  minimum: [
    ["Period 1", "8:30", "9:18"],
    ["Period 2", "9:24", "9:59"],
    ["Period 3", "10:05", "10:40"],
    ["Lunch", "10:40", "11:10"],
    ["Period 4", "11:16", "11:51"],
    ["Period 5", "11:57", "12:32"],
    ["Period 6", "12:38", "13:13"],
  ],
  shortened: [
    ["Period 1", "8:30", "9:28"],
    ["Period 2", "9:34", "10:20"],
    ["Period 3", "10:26", "11:12"],
    ["Lunch", "11:12", "11:42"],
    ["Period 4", "11:48", "12:34"],
    ["Period 5", "12:40", "13:26"],
    ["Period 6", "13:32", "14:18"],
  ],
};

// Auto-select Tuesday PD on Tuesdays
window.onload = () => {
  if (new Date().getDay() === 2) {
    scheduleSelect.value = "tuesday";
  }

  updateTimer();
  setInterval(updateTimer, 1000);
};

scheduleSelect.addEventListener("change", () => {
  updateTimer();
});

function updateTimer() {
  countdownEl.textContent = "Timer script running successfully!"; // Debug line to confirm script runs

  const schedule = schedules[scheduleSelect.value];

  const now = new Date();
  let currentPeriodIndex = -1;
  let periodStart = null;
  let periodEnd = null;

  for (let i = 0; i < schedule.length; i++) {
    const period = schedule[i];
    const startTime = parseTime(period[1]);
    const endTime = parseTime(period[2]);

    if (now >= startTime && now < endTime) {
      currentPeriodIndex = i;
      periodStart = startTime;
      periodEnd = endTime;
      break;
    }
  }

  if (currentPeriodIndex === -1) {
    messageEl.textContent = "No active period";
    progressBar.style.width = "0%";
    countdownEl.textContent = "";
    periodInfo.textContent = "";
    return;
  }

  const totalPeriodSeconds = (periodEnd - periodStart) / 1000;
  const elapsedSeconds = (now - periodStart) / 1000;
  const remainingSeconds = totalPeriodSeconds - elapsedSeconds;

  progressBar.style.width = ((elapsedSeconds / totalPeriodSeconds) * 100).toFixed(2) + "%";

  messageEl.textContent = "Time Remaining in " + schedule[currentPeriodIndex][0] + ":";

  countdownEl.textContent = formatTime(remainingSeconds);

  periodInfo.textContent = schedule[currentPeriodIndex][0];
}

function parseTime(timeString) {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
