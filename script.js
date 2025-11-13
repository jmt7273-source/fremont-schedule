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
if (new Date().getDay() === 2) {
  scheduleSelect.value = "tuesday";
}

function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getCurrentPeriod(schedule) {
  const now = new Date();
  for (let i = 0; i < schedule.length; i++) {
    const [name, start, end] = schedule[i];
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    if (now >= startTime && now <= endTime) return { name, startTime, endTime };
    if (i < schedule.length - 1 && now > endTime && now < parseTime(schedule[i + 1][1])) {
      return { name: "Passing Period", startTime: endTime, endTime: parseTime(schedule[i + 1][1]) };
    }
  }
  return null;
}

function updateTimer() {
  const schedule = schedules[scheduleSelect.value];
  const now = new Date();
  const current = getCurrentPeriod(schedule);

  if (!current) {
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "gray";
    countdownEl.textContent = "";
    periodInfo.textContent = "";
    messageEl.textContent = "School's Out!";
    messageEl.classList.add("flash");
    return;
  }

  messageEl.classList.remove("flash");

  const total = current.endTime - current.startTime;
  const remaining = current.endTime - now;
  const percent = 100 - (remaining / total) * 100;

  progressBar.style.width = `${percent}%`;

  const minutesLeft = Math.floor(remaining / 60000);
  const secondsLeft = Math.floor((remaining % 60000) / 1000);
  countdownEl.textContent = `${minutesLeft}m ${secondsLeft}s left`;

  periodInfo.textContent = current.name;

  const minsFromStart = (now - current.startTime) / 60000;
  const minsToEnd = remaining / 60000;

  // Smooth color fade between green and red
  if (minsFromStart <= 15 || minsToEnd <= 15) {
    progressBar.style.backgroundColor = "red";
    messageEl.textContent = "No restroom or passes right now!";
  } else {
    progressBar.style.backgroundColor = "green";
    messageEl.textContent = "";
  }
}

setInterval(updateTimer, 1000);
updateTimer();
