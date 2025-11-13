// --- script.js ---
const schedules = {
  regular: [
    { name: "Period 1", start: "8:30", end: "9:38" },
    { name: "Period 2", start: "9:44", end: "10:41" },
    { name: "Period 3", start: "10:47", end: "11:44" },
    { name: "Lunch", start: "11:44", end: "12:14" },
    { name: "Period 4", start: "12:20", end: "13:17" },
    { name: "Period 5", start: "13:23", end: "14:20" },
    { name: "Period 6", start: "14:26", end: "15:23" },
  ],
  tuesday: [
    { name: "Period 1", start: "8:30", end: "9:28" },
    { name: "Period 2", start: "9:34", end: "10:21" },
    { name: "Period 3", start: "10:27", end: "11:14" },
    { name: "Lunch", start: "11:14", end: "11:44" },
    { name: "Period 4", start: "11:50", end: "12:37" },
    { name: "Period 5", start: "12:43", end: "13:30" },
    { name: "Period 6", start: "13:36", end: "14:23" },
  ],
  minimum: [
    { name: "Period 1", start: "8:30", end: "9:18" },
    { name: "Period 2", start: "9:24", end: "9:59" },
    { name: "Period 3", start: "10:05", end: "10:40" },
    { name: "Lunch", start: "10:40", end: "11:10" },
    { name: "Period 4", start: "11:16", end: "11:51" },
    { name: "Period 5", start: "11:57", end: "12:32" },
    { name: "Period 6", start: "12:38", end: "13:13" },
  ],
  shortened: [
    { name: "Period 1", start: "8:30", end: "9:28" },
    { name: "Period 2", start: "9:34", end: "10:20" },
    { name: "Period 3", start: "10:26", end: "11:12" },
    { name: "Lunch", start: "11:12", end: "11:42" },
    { name: "Period 4", start: "11:48", end: "12:34" },
    { name: "Period 5", start: "12:40", end: "13:26" },
    { name: "Period 6", start: "13:32", end: "14:18" },
  ]
};

function parseTimeToDate(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  return now;
}

function getScheduleForDay(type, now) {
  return schedules[type].map(period => ({
    name: period.name,
    start: parseTimeToDate(period.start),
    end: parseTimeToDate(period.end)
  }));
}

function updateTimer() {
  const now = new Date();
  const progressBar = document.getElementById("progress-bar");
  const barText = document.getElementById("bar-text");
  const periodInfo = document.getElementById("period-info");
  const scheduleType = document.getElementById("scheduleSelect").value;
  const todaySchedule = getScheduleForDay(scheduleType, now);

  let currentPeriod = null;
  let nextPeriod = null;

  for (let i = 0; i < todaySchedule.length; i++) {
    const p = todaySchedule[i];
    if (now >= p.start && now < p.end) {
      currentPeriod = p;
      nextPeriod = todaySchedule[i + 1] || null;
      break;
    } else if (now < p.start) {
      nextPeriod = p;
      break;
    }
  }

  let newText = "";
  let newInfo = "";

  if (currentPeriod) {
    const elapsed = now - currentPeriod.start;
    const total = currentPeriod.end - currentPeriod.start;
    const remainingMs = currentPeriod.end - now;
    const remainingMin = Math.floor(remainingMs / (1000 * 60));
    const percent = (elapsed / total) * 100;

    progressBar.style.width = `${percent}%`;

    const first15 = elapsed <= 15 * 60 * 1000;
    const last15 = remainingMs <= 15 * 60 * 1000;

    if (first15 || last15) {
      progressBar.classList.add("bar-warning");
      barText.classList.add("flash-text");
      newText = "No Bathroom or Passes";
    } else {
      progressBar.classList.remove("bar-warning");
      barText.classList.remove("flash-text");
      newText = `${remainingMin} min left`;
    }
    newInfo = `${currentPeriod.name} – ends at ${formatTime(currentPeriod.end)}`;
  } else if (nextPeriod) {
    const prevPeriodEnd = todaySchedule.find(p => p.end <= nextPeriod.start)?.end || now;
    const total = nextPeriod.start - prevPeriodEnd;
    const elapsed = now - prevPeriodEnd;
    const percent = Math.min((elapsed / total) * 100, 100);
    const remainingMin = Math.max(Math.ceil((nextPeriod.start - now) / (1000 * 60)), 0);

    progressBar.style.width = `${percent}%`;
    progressBar.classList.remove("bar-warning");
    barText.classList.remove("flash-text");
    newText = `${remainingMin} min until ${nextPeriod.name}`;
    newInfo = `Passing Period – Next: ${nextPeriod.name} (${formatTime(nextPeriod.start)})`;
  } else {
    progressBar.style.width = "100%";
    progressBar.classList.remove("bar-warning");
    barText.classList.remove("flash-text");
    newText = "School's Out!";
    newInfo = "School's Out!";
  }

  fadeText(barText, newText);
  fadeText(periodInfo, newInfo);
  document.getElementById("live-clock").textContent = formatTime(now);
}

function fadeText(element, newText) {
  if (element.textContent !== newText) {
    element.classList.remove("show");
    element.classList.add("fade");
    setTimeout(() => {
      element.textContent = newText;
      element.classList.add("show");
    }, 150);
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

setInterval(updateTimer, 1000);
updateTimer();