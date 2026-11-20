/* =========================================================
   CampusConnect - app.js  (SHARED CODE)
   Code that every role uses: helpers, cards, toast messages,
   navigation and drawing the screen.

   Each role has its own file (admin.js, ...). A role file adds:
     - roles.<role>  -> its menu, top button and search hint
     - pages.<name>  -> the functions that build its pages

   How it works (in short):
   1. We remember which page is open in "currentPage".
   2. Every page is a function that RETURNS some HTML text.
   3. render() puts that HTML inside <main id="content">.
   4. Buttons call small functions that change the data,
      save it, and call render() again.
   ========================================================= */


/* ---------- 1. Who is logged in? ---------- */

const user = JSON.parse(localStorage.getItem("ccUser"));
if (user === null) {
  window.location.href = "index.html"; // not logged in -> go to sign in
}


/* ---------- 2. Places where role files add their things ---------- */

const roles = {};              // menu, top button, search hint for each role
const pages = { profile };     // page name -> function that builds the page


/* ---------- 3. Shared settings ---------- */

// Icon and colour for each kind of event
const eventTypes = {
  tech:      { label: "Technology", icon: "cpu",             color: "blue" },
  career:    { label: "Career",     icon: "briefcase",       color: "peach" },
  social:    { label: "Social",     icon: "party-popper",    color: "lilac" },
  community: { label: "Community",  icon: "heart-handshake", color: "aqua" },
  sports:    { label: "Sports",     icon: "trophy",          color: "violet" }
};

// Colour of each status badge
const badgeColors = {
  "Registered": "info", "Checked In": "success",
  "Available": "success",
  "To Do": "neutral", "In Progress": "warning", "Completed": "success",
  "Not Started": "neutral", "Setting Up": "warning", "Ready": "success",
  "Upcoming": "info", "Full": "danger", "Past": "neutral"
};


/* ---------- 4. App state (what is on screen right now) ---------- */

let currentPage = "";   // the page being shown
let activeMenu = "";    // which menu item is highlighted
let selectedId = null;  // e.g. which event is opened
let searchText = "";    // what is typed in the search box
let toastTimer = null;


/* ---------- 5. Small helper functions ---------- */

// Stops user-typed text from being treated as HTML code.
function clean(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Read the value of an input box by its id.
function value(id) {
  return document.getElementById(id).value.trim();
}

// "2026-12-15" -> "15 Dec 2026"
function formatDate(dateText) {
  const date = new Date(dateText + "T00:00");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// "14:30" -> "2:30 PM"
function formatTime(timeText) {
  let [hour, minute] = timeText.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return hour + ":" + String(minute).padStart(2, "0") + " " + ampm;
}

// How many days until the event?
function daysUntil(dateText) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(dateText + "T00:00");
  return Math.round((eventDay - today) / (1000 * 60 * 60 * 24));
}

function daysLabel(dateText) {
  const days = daysUntil(dateText);
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return "In " + days + " days";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// First letters of the name, e.g. "Ahmed Khan" -> "AK"
function initials(name) {
  return name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
}

// "admin" -> "Admin"
function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

// Next free number id for a list (events, tasks, stalls)
function nextId(list) {
  let biggest = 0;
  for (const item of list) {
    if (item.id > biggest) biggest = item.id;
  }
  return biggest + 1;
}

// Does this text contain what the user typed in the search box?
function matches(text) {
  return text.toLowerCase().includes(searchText.toLowerCase());
}

/* --- Data look-ups --- */

function getEvent(id) {
  return data.events.find(ev => ev.id === id);
}

function seatsTaken(eventId) {
  return data.registrations.filter(reg => reg.eventId === eventId).length;
}

function tasksOf(eventId) {
  return data.tasks.filter(task => task.eventId === eventId);
}

function stallsOf(eventId) {
  return data.stalls.filter(stall => stall.eventId === eventId);
}

// Upcoming events, nearest date first
function upcomingEvents() {
  return data.events
    .filter(ev => daysUntil(ev.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function eventStatus(ev) {
  if (daysUntil(ev.date) < 0) return "Past";
  if (seatsTaken(ev.id) >= ev.capacity) return "Full";
  return "Upcoming";
}


/* ---------- 6. Reusable pieces of HTML ---------- */

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function badge(status) {
  const color = badgeColors[status] || "neutral";
  return `<span class="badge ${color}">${status}</span>`;
}

function pageHead(title, text) {
  return `<div class="page-head"><h1>${title}</h1><p>${text}</p></div>`;
}

function backLink(page, text) {
  return `<button class="btn-link back" onclick="goTo('${page}')">${icon("arrow-left")} ${text}</button>`;
}

function kpiCard(iconName, color, title, number, note) {
  return `
    <div class="kpi-card">
      <div class="icon-tile tile-${color}">${icon(iconName)}</div>
      <p class="kpi-title">${title}</p>
      <p class="kpi-value">${number}</p>
      <p class="kpi-note">${note}</p>
    </div>`;
}

function emptyState(iconName, text) {
  return `<div class="empty">${icon(iconName)}<p>${text}</p></div>`;
}

function progressBar(done, total) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return `<div class="progress"><div style="width:${percent}%"></div></div>`;
}

// Shows progress steps like:  To Do -> In Progress -> Completed
// Steps up to the current one are coloured in.
function steps(allSteps, current) {
  const position = allSteps.indexOf(current);
  let html = `<div class="steps">`;
  allSteps.forEach((step, i) => {
    html += `<span class="step ${i <= position ? "done" : ""}">${step}</span>`;
  });
  return html + `</div>`;
}

// Date, time and place lines for an event
function eventMeta(ev) {
  return `
    <p class="meta">${icon("calendar-days")} ${formatDate(ev.date)}</p>
    <p class="meta">${icon("clock-3")} ${formatTime(ev.start)} - ${formatTime(ev.end)}</p>
    <p class="meta">${icon("map-pin")} ${clean(ev.location)}</p>`;
}

// The pastel event card.
// "detail" = the progress text, "done/total" = the bar, "button" = footer link
function eventCard(ev, detail, done, total, button) {
  const type = eventTypes[ev.type];
  return `
    <div class="event-card card-${type.color}">
      <div class="event-card-top">
        <div class="icon-tile solid">${icon(type.icon)}</div>
        <span class="date-pill">${daysLabel(ev.date)}</span>
      </div>
      <h3>${clean(ev.title)}</h3>
      ${eventMeta(ev)}
      <p class="progress-label">${detail}</p>
      ${progressBar(done, total)}
      <div class="event-card-foot">${button}</div>
    </div>`;
}


/* ---------- 7. Shared page: My Profile ---------- */

function profile() {
  return `
    ${pageHead("My Profile", "Your account on CampusConnect.")}
    <div class="panel profile-card">
      <span class="avatar big">${initials(user.name)}</span>
      <div><h2>${clean(user.name)}</h2><p class="sub">${capitalize(user.role)}</p></div>
    </div>
    <div class="panel form">
      <h3>Demo data</h3>
      <p class="sub">Brings back the original sample events, tasks and stalls.</p>
      <div class="form-actions start">
        <button class="btn btn-secondary" onclick="resetDemo()">Reset demo data</button>
        <button class="btn btn-danger" onclick="logOut()">${icon("log-out")} Log Out</button>
      </div>
    </div>`;
}


/* ---------- 8. Shared actions ---------- */

function resetDemo() {
  if (!confirm("Reset all events, tasks and stalls to the sample data?")) return;
  resetData();
  showToast("Demo data has been reset.");
  render();
}

function logOut() {
  localStorage.removeItem("ccUser");
  window.location.href = "index.html";
}

function toggleMenu() {
  document.getElementById("dropdown").classList.toggle("open");
}

function onSearch() {
  searchText = document.getElementById("searchInput").value;
  render();
}

// Small pop-up message, e.g. "Event created"
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.innerHTML = icon(type === "error" ? "circle-alert" : "circle-check") + `<span>${clean(message)}</span>`;
  toast.className = "toast show " + type;
  drawIcons();

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = "toast " + type; }, 3000);
}


/* ---------- 9. Navigation and drawing the screen ---------- */

// Open a page. "id" is optional (e.g. which event to show).
function goTo(page, id) {
  currentPage = page;
  selectedId = id;

  // Highlight the menu item only if this page is in the menu
  if (roles[user.role].menu.some(item => item.page === page)) {
    activeMenu = page;
  }

  // Clear the search when changing page
  searchText = "";
  document.getElementById("searchInput").value = "";

  window.scrollTo(0, 0);
  render();
}

function renderNav() {
  let html = "";
  for (const item of roles[user.role].menu) {
    // Some menu items have a rule ("onlyIf"). Hide them if the rule says no.
    if (item.onlyIf && !item.onlyIf()) continue;

    const active = item.page === activeMenu ? "active" : "";
    html += `<button class="nav-item ${active}" onclick="goTo('${item.page}')">${icon(item.icon)}<span>${item.label}</span></button>`;
  }
  document.getElementById("nav").innerHTML = html;
}

function renderTopBar() {
  const action = roles[user.role].action;
  const button = document.getElementById("topAction");
  button.innerHTML = icon(action.icon) + `<span>${action.label}</span>`;
  button.onclick = () => goTo(action.page);

  document.getElementById("searchInput").placeholder = roles[user.role].searchHint;
  document.getElementById("avatar").textContent = initials(user.name);
  document.getElementById("userName").textContent = user.name;
  document.getElementById("userRole").textContent = capitalize(user.role);
}

// Turn every <i data-lucide="..."> into a real icon
function drawIcons() {
  if (window.lucide) lucide.createIcons();
}

// Draw the whole screen again
function render() {
  renderNav();
  renderTopBar();
  document.getElementById("content").innerHTML = pages[currentPage]();
  drawIcons();
}

// Called once, after all role files are loaded
function startApp() {
  currentPage = roles[user.role].menu[0].page; // open the first menu item
  activeMenu = currentPage;
  render();
}
