/* =========================================================
   CampusConnect - volunteer.js  (ROLE 3: VOLUNTEER)
   The Volunteer claims tasks, updates their progress,
   and (if on the Registration Desk) checks attendees in.
   ========================================================= */


/* ---------- 1. Volunteer menu, top button and search hint ---------- */

roles.volunteer = {
  menu: [
    { page: "volunteerHome",  label: "Overview",        icon: "layout-dashboard" },
    { page: "availableTasks", label: "Available Tasks", icon: "list-todo" },
    { page: "myTasks",        label: "My Tasks",        icon: "clipboard-check" },
    // Check-In only shows if the volunteer has a Registration Desk task
    { page: "checkIn",        label: "Check-In",        icon: "scan-line", onlyIf: hasDeskTask }
  ],
  action: { label: "Claim Task", icon: "plus", page: "availableTasks" },
  searchHint: "Search tasks..."
};


/* ---------- 2. Helpers ---------- */

// Tasks claimed by the logged-in volunteer
function myTasks() {
  return data.tasks.filter(task => task.volunteer === user.name);
}

// Tasks nobody has claimed yet
function openTasks() {
  return data.tasks.filter(task => task.volunteer === "");
}

// Only volunteers with a "Registration Desk" task may check people in
function hasDeskTask() {
  return myTasks().some(task => task.title === "Registration Desk");
}

// The registration ID typed on the Check-In page (null = nothing searched yet)
let checkInSearch = null;


/* ---------- 3. Overview page ---------- */

function volunteerHome() {
  const mine = myTasks();
  return `
    ${pageHead(greeting() + ", " + clean(user.name), "Your event responsibilities at a glance.")}

    <div class="kpi-row three">
      ${kpiCard("clipboard-list", "violet", "My Tasks", mine.length, "Claimed by you")}
      ${kpiCard("loader", "peach", "In Progress", mine.filter(t => t.status === "In Progress").length, "Being worked on")}
      ${kpiCard("circle-check", "aqua", "Completed", mine.filter(t => t.status === "Completed").length, "Finished tasks")}
    </div>

    <section>
      <div class="section-head"><h2>My Tasks</h2></div>
      ${taskGrid(mine, "You have not claimed any tasks yet.")}
    </section>

    <section>
      <div class="section-head">
        <h2>Available Tasks</h2>
        <button class="btn-link" onclick="goTo('availableTasks')">See all</button>
      </div>
      ${taskGrid(openTasks().slice(0, 3), "No available tasks right now.")}
    </section>`;
}


/* ---------- 4. Available Tasks and My Tasks pages ---------- */

function availableTasks() {
  return `
    ${pageHead("Available Tasks", "Pick a task you can help with and claim it.")}
    ${taskGrid(openTasks(), "No available tasks for any event yet.")}`;
}

function myTasksPage() {
  return `
    ${pageHead("My Tasks", "Update your progress as you work.")}
    ${taskGrid(myTasks(), "You have not claimed any tasks yet.")}`;
}

// A grid of task cards (with search filter and empty message)
function taskGrid(tasks, emptyText) {
  const list = tasks.filter(task => matches(task.title + getEvent(task.eventId).title));
  if (list.length === 0) return emptyState("clipboard-list", emptyText);
  return `<div class="item-grid">${list.map(taskCard).join("")}</div>`;
}

// One task card. The button changes with the task's status:
//   not claimed -> Claim Task
//   To Do       -> Start Task
//   In Progress -> Mark Completed
//   Completed   -> "All done"
function taskCard(task) {
  const ev = getEvent(task.eventId);
  const claimed = task.volunteer !== "";
  let action;

  if (!claimed) {
    action = `<button class="btn btn-primary btn-small" onclick="claimTask(${task.id})">Claim Task</button>`;
  } else if (task.status === "To Do") {
    action = `<button class="btn btn-primary btn-small" onclick="setTaskStatus(${task.id}, 'In Progress')">Start Task</button>`;
  } else if (task.status === "In Progress") {
    action = `<button class="btn btn-primary btn-small" onclick="setTaskStatus(${task.id}, 'Completed')">Mark Completed</button>`;
  } else {
    action = `<span class="done-text">${icon("circle-check")} All done</span>`;
  }

  return `
    <div class="item-card">
      <div class="item-top">
        <div class="icon-tile tile-violet">${icon("clipboard-list")}</div>
        ${badge(claimed ? task.status : "Available")}
      </div>
      <h3>${clean(task.title)}</h3>
      <p class="meta">${icon("calendar-days")} ${clean(ev.title)} · ${formatDate(ev.date)}</p>
      <p class="meta">${icon("clock-3")} ${clean(task.time)}</p>
      <p class="meta">${icon("map-pin")} ${clean(task.location)}</p>
      ${claimed ? steps(["To Do", "In Progress", "Completed"], task.status) : ""}
      <div class="item-foot">${action}</div>
    </div>`;
}


/* ---------- 5. Check-In page (Registration Desk) ---------- */

function checkIn() {
  return `
    ${pageHead("Registration Desk Check-In", "Type the attendee's Registration ID to check them in.")}

    <form class="panel checkin-form" onsubmit="findAttendee(event)">
      <label for="regInput">Registration ID</label>
      <div class="row">
        <input id="regInput" placeholder="e.g. CC-1001" value="${checkInSearch ? clean(checkInSearch) : ""}" required>
        <button class="btn btn-primary">${icon("search")} Find</button>
      </div>
    </form>

    ${checkInResult()}`;
}

// What to show under the search box
function checkInResult() {
  if (checkInSearch === null) return ""; // nothing searched yet

  const reg = data.registrations.find(r => r.id === checkInSearch);

  // 1. Wrong ID
  if (!reg) {
    return `<div class="panel notice error">${icon("circle-alert")}
      No registration found for <code>${clean(checkInSearch)}</code>. Check the ID and try again.</div>`;
  }

  // 2. Found: show the attendee, and the button OR "already checked in"
  const ev = getEvent(reg.eventId);
  const action = reg.checkedIn
    ? `<div class="notice success">${icon("circle-check")} ${clean(reg.name)} is already checked in.</div>`
    : `<button class="btn btn-primary" onclick="checkInAttendee('${reg.id}')">${icon("user-check")} Check In</button>`;

  return `
    <div class="panel attendee-card">
      <div class="person">
        <span class="avatar">${initials(reg.name)}</span>
        <div><strong>${clean(reg.name)}</strong><span class="sub"><code>${reg.id}</code> · ${clean(ev.title)}</span></div>
      </div>
      ${badge(reg.checkedIn ? "Checked In" : "Registered")}
      <div class="attendee-action">${action}</div>
    </div>`;
}


/* ---------- 6. Volunteer actions (what the buttons do) ---------- */

function claimTask(taskId) {
  data = loadData(); // get the newest data: someone else may have claimed it
  const task = data.tasks.find(t => t.id === taskId);

  if (task.volunteer !== "") {
    showToast("Sorry, this task was already claimed by someone else.", "error");
  } else {
    task.volunteer = user.name;
    task.status = "To Do";
    saveData();
    showToast("Task claimed: " + task.title);
  }
  render();
}

function setTaskStatus(taskId, newStatus) {
  const task = data.tasks.find(t => t.id === taskId);
  task.status = newStatus;
  saveData();
  showToast(task.title + " is now " + newStatus + ".");
  render();
}

function findAttendee(e) {
  e.preventDefault(); // stop the form from reloading the page
  checkInSearch = value("regInput").toUpperCase(); // "cc-1001" -> "CC-1001"
  render();
}

function checkInAttendee(regId) {
  const reg = data.registrations.find(r => r.id === regId);
  reg.checkedIn = true;
  saveData();
  showToast(reg.name + " has been checked in.");
  render();
}


/* ---------- 7. Tell the app about the Volunteer pages ---------- */

pages.volunteerHome = volunteerHome;
pages.availableTasks = availableTasks;
pages.myTasks = myTasksPage;
pages.checkIn = checkIn;
