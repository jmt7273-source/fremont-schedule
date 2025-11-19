/* -----------------------------------------------------------
   Fremont Automated Schedule System with Bathroom Logic
----------------------------------------------------------- */

let regularSchedule = [
    { name: "Period 1", start: "08:30", end: "09:30" },
    { name: "Period 2", start: "09:35", end: "10:35" },
    { name: "Period 3", start: "10:40", end: "11:40" },
    { name: "Lunch",    start: "11:40", end: "12:20" },
    { name: "Period 4", start: "12:25", end: "13:25" },
    { name: "Period 5", start: "13:30", end: "14:30" }
];

let tuesdaySchedule = [
    { name: "Period 1", start: "09:00", end: "09:50" },
    { name: "Period 2", start: "09:55", end: "10:45" },
    { name: "Period 3", start: "10:50", end: "11:40" },
    { name: "Lunch",    start: "11:40", end: "12:20" },
    { name: "Period 4", start: "12:25", end: "13:15" },
    { name: "Period 5", start: "13:20", end: "14:10" }
];

function getActiveSchedule() {
    const override = document.getElementById("scheduleOverride").value;
    const todayIsTuesday = new Date().getDay() === 2;

    if (override === "regular") return regularSchedule;
    if (override === "tuesday") return tuesdaySchedule;

    return todayIsTuesday ? tuesdaySchedule : regularSchedule;
}

/* ----------------------------
   Countdown Bar Logic
---------------------------- */
function updateCountdown() {
    let schedule = getActiveSchedule();
    let now = new Date();
    let currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentPeriod = schedule.find(p => {
        let s = toMinutes(p.start);
        let e = toMinutes(p.end);
        return currentMinutes >= s && currentMinutes < e;
    });

    let bar = document.getElementById("countdown-bar");
    let text = document.getElementById("countdown-text");

    if (!currentPeriod) {
        bar.style.setProperty("--w", "0%");
        text.textContent = "School's Out!";
        return;
    }

    let start = toMinutes(currentPeriod.start);
    let end = toMinutes(currentPeriod.end);
    let total = end - start;
    let elapsed = currentMinutes - start;
    let remaining = (end * 60) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());

    let pct = (elapsed / total) * 100;
    bar.style.position = "relative";
    bar.querySelector("::after");

    bar.style.setProperty("--w", pct + "%");

    let first15 = start + 15;
    let last15 = end - 15;

    let secondsLeft = remaining;
    let m = Math.floor(secondsLeft / 60);
    let s = secondsLeft % 60;

    if (currentMinutes < first15 || currentMinutes >= last15) {
        let minsLeft = (currentMinutes < first15)
            ? (first15 - currentMinutes)
            : (end - currentMinutes);

        text.textContent = `No Bathroom or Passes — ${m}:${s.toString().padStart(2,"0")}`;
        text.style.color = "white";
        bar.style.setProperty("--barColor", "red");
    } else {
        text.textContent = `${currentPeriod.name} — ${m}:${s.toString().padStart(2,"0")}`;
        bar.style.setProperty("--barColor", "gray");
    }
}

function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

setInterval(updateCountdown, 1000);

/* ----------------------------
   Custom Timer Logic
---------------------------- */

let customTime = 0;
let customTimerRunning = false;

document.getElementById("startCustomTimer").addEventListener("click", () => {
    let min = parseInt(document.getElementById("customMin").value);
    let sec = parseInt(document.getElementById("customSec").value);
    customTime = min * 60 + sec;
    customTimerRunning = true;
});

document.getElementById("stopCustomTimer").addEventListener("click", () => {
    customTimerRunning = false;
});

setInterval(() => {
    if (!customTimerRunning || customTime <= 0) return;

    customTime--;
    let m = Math.floor(customTime / 60);
    let s = customTime % 60;

    document.getElementById("custom-timer-display").textContent =
        `${m}:${s.toString().padStart(2, "0")}`;
}, 1000);

/* ----------------------------
   Fullscreen Button
---------------------------- */
document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});
