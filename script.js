const progressBar = document.getElementById("progress-bar");
const barText = document.getElementById("bar-text");
const periodInfo = document.getElementById("period-info");
const scheduleSelect = document.getElementById("scheduleSelect");
const liveClock = document.getElementById("live-clock");

const schedules = {
  regular: [
    ["Period 1", "8:30 AM", "9:38 AM"],
    ["Period 2", "9:44 AM", "10:41 AM"],
    ["Period 3", "10:47 AM", "11:44 AM"],
    ["Lunch", "11:44 AM", "12:14 PM"],
    ["Period 4", "12:20 PM", "1:17 PM"],
    ["Period 5", "1:23 PM", "2:20 PM"],
    ["Period 6", "2:26 PM", "3:23 PM"],
  ],
  tuesday: [
    ["Period 1", "8:30 AM", "9:28 AM"],
    ["Period 2", "9:34 AM", "10:21 AM"],
    ["Period 3", "10:27 AM", "11:14 AM"],
    ["Lunch", "11:14 AM", "11:44 AM"],
    ["Period 4", "11:50 AM", "12:37 PM"],
    ["Period 5", "12:43 PM", "1:30 PM"],
    ["Period 6", "1:36 PM", "2:23 PM"],
  ],
  minimum: [
    ["Period 1", "8:30 AM", "9:18 AM"],
    ["Period 2", "9:24 AM", "9:59 AM"],
    ["Period 3", "10:05 AM", "10:40 AM"],
    ["Lunch", "10:40 AM", "11:10 AM"],
    ["Period 4", "11:16 AM", "11:51 AM"],
    ["Period 5", "11:57 AM", "12:32 PM"],
    ["Period 6", "12:38 PM", "1:13 PM"],
  ],
  shortened: [
    ["Period 1", "8:30 AM", "9:28 AM"],
    ["Period 2", "9:34 AM", "10:20 AM"],
    ["Period 3", "10:26 AM", "11:12 AM"],
    ["Lunch", "11:12 AM", "11:42 AM"],
    ["Period 4", "11:48 AM", "12:34 PM"],
    ["Period 5", "12:40 PM", "1:26 PM"],
    ["Period 6", "1:32 PM", "2:18 PM"],
  ],
};

// Automatically use Tuesday PD if today is Tuesday
if (new Date().getDay() === 2) {
  scheduleSelect.value = "tuesday";
}

function parseTime(timeStr) {
  const d = new Date();
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  d.setHours(hours, minutes, 0, 0);
  return d;
}

function getCurrentPeriod(schedule) {
  const now = new Date();
  for (let i = 0; i < schedule.length; i++) {
    const [name, start, end] = schedule[i];
    const startTime = parseTime(start);
    const endTime = parseTime(end);

    if (now >= startTime && now <= endTime) {
      return { name, startTime, endTime };
    }

    if (i < schedule.length - 1 && now > endTime && now < parseTime(schedule[i + 1][1])) {
      return {
        name: "Passing Period",
        startTime: endTime,
        endTime: parseTime(schedule[i + 1][1]),
      };
    }
  }
  return null;
}

function updateTimer() {
  const schedule = schedules[scheduleSelect.value];
  const now = new Date();
  const current = getCurrentPeriod(schedule);

  // Live clock
  liveClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // After final period
  if (!current) {
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "gray";
    barText.textContent = "School’s Out!";
    barText.classList.add("flash");
    periodInfo.textContent = "";
    return;
  }

  barText.classList.remove("flash");

  const total = current.endTime - current.startTime;
  const remaining = current.endTime - now;
  const percent = 100 - (remaining / total) * 100;
  progressBar.style.width = `${Math.max(0, percent)}%`;

  const minutesLeft = Math.floor(remaining / 60000);
  const secondsLeft = Math.floor((remaining % 60000) / 1000);
  const timeLeft = `${minutesLeft}m ${secondsLeft}s left`;

  periodInfo.textContent = current.name;

  const minsFromStart = (now - current.startTime) / 60000;
  const minsToEnd = remaining / 60000;

  if (minsFromStart <= 15 || minsToEnd <= 15) {
    progressBar.style.backgroundColor = "red";
    barText.textContent = `No Bathroom or Passes • ${timeLeft}`;
  } else {
    progressBar.style.backgroundColor = "green";
    barText.textContent = timeLeft;
  }
}

setInterval(updateTimer, 1000);
updateTimer();
