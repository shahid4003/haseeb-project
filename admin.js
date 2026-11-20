/* =========================================================
   CampusConnect - admin.js  (ROLE 1: ADMIN)
   The Admin creates events and manages attendees,
   volunteer tasks and vendor stalls.
   ========================================================= */


/* ---------- 1. Admin menu, top button and search hint ---------- */

roles.admin = {
  menu: [
    { page: "adminHome",  label: "Overview",   icon: "layout-dashboard" },
    { page: "events",     label: "Events",     icon: "calendar-days" },
    { page: "attendees",  label: "Attendees",  icon: "users-round" },
    { page: "volunteers", label: "Volunteers", icon: "clipboard-check" },
    { page: "vendors",    label: "Vendors",    icon: "store" }
  ],
  action: { label: "Create Event", icon: "plus", page: "createEvent" },
  searchHint: "Search events..."
};


/* ---------- 2. Overview page ---------- */

function adminHome() {
  return `
    ${pageHead(greeting() + ", " + clean(user.name), "Here is what is happening across campus events.")}

    <div class="kpi-row">
      ${kpiCard("calendar-days", "violet", "Total Events", data.events.length, "All events")}
      ${kpiCard("calendar-clock", "blue", "Upcoming Events", upcomingEvents().length, "Scheduled ahead")}
      ${kpiCard("ticket", "lilac", "Registrations", data.registrations.length, "Across " + data.events.length + " events")}
      ${kpiCard("hand-helping", "aqua", "Volunteers", uniqueNames(data.tasks, "volunteer").length, "With claimed tasks")}
      ${kpiCard("store", "peach", "Vendors", uniqueNames(data.stalls, "vendor").length, "With claimed stalls")}
    </div>

    <section>
      <div class="section-head">
        <h2>Upcoming Events</h2>
        <button class="btn-link" onclick="goTo('events')">See all</button>
      </div>
      ${adminEventGrid(upcomingEvents().slice(0, 4))}
    </section>

    <section class="panel">
      <div class="section-head"><h2>Manage Events</h2></div>
      ${eventsTable()}
    </section>`;
}

// How many different people have claimed something (no repeats)
function uniqueNames(list, field) {
  const names = [];
  for (const item of list) {
    if (item[field] !== "" && !names.includes(item[field])) names.push(item[field]);
  }
  return names;
}

// Event cards for the Admin show how many tasks are finished
function adminEventGrid(events) {
  const list = events.filter(ev => matches(ev.title + ev.location));
  if (list.length === 0) return emptyState("search-x", "No events match your search.");

  let html = `<div class="event-grid">`;
  for (const ev of list) {
    const tasks = tasksOf(ev.id);
    const done = tasks.filter(task => task.status === "Completed").length;
    const button = `<button class="btn-link" onclick="goTo('manageEvent', ${ev.id})">Manage Event ${icon("arrow-right")}</button>`;
    const detail = tasks.length === 0 ? "No volunteer tasks yet" : `${done} / ${tasks.length} tasks complete`;
    html += eventCard(ev, detail, done, tasks.length, button);
  }
  return html + `</div>`;
}


/* ---------- 3. Events page (table of all events) ---------- */

function events() {
  return `
    ${pageHead("Manage Events", "Create, open and remove campus events.")}
    <section class="panel">${eventsTable()}</section>`;
}

function eventsTable() {
  const list = data.events.filter(ev => matches(ev.title + ev.location));
  if (list.length === 0) return emptyState("search-x", "No events match your search.");

  let rows = "";
  for (const ev of list) {
    rows += `
      <tr>
        <td><strong>${clean(ev.title)}</strong><span class="sub">${eventTypes[ev.type].label}</span></td>
        <td>${formatDate(ev.date)}</td>
        <td>${clean(ev.location)}</td>
        <td class="num">${seatsTaken(ev.id)} / ${ev.capacity}</td>
        <td>${badge(eventStatus(ev))}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-small" onclick="goTo('manageEvent', ${ev.id})">Manage</button>
          <button class="btn btn-danger btn-small" onclick="deleteEvent(${ev.id})">Delete</button>
        </td>
      </tr>`;
  }
  return `
    <div class="table-wrap"><table>
      <thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Registrations</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}


/* ---------- 4. Create Event page (a form) ---------- */

function createEvent() {
  let typeOptions = "";
  for (const key in eventTypes) {
    typeOptions += `<option value="${key}">${eventTypes[key].label}</option>`;
  }
  const today = new Date().toISOString().slice(0, 10); // e.g. "2026-11-13"

  return `
    ${backLink("events", "Back to events")}
    ${pageHead("Create Event", "Fill in the details below. All fields are required.")}

    <form class="panel form" onsubmit="saveEvent(event)">
      <h3>Basic details</h3>
      <div class="field"><label for="fTitle">Event title</label><input id="fTitle" required></div>
      <div class="field"><label for="fDesc">Description</label><textarea id="fDesc" required></textarea></div>
      <div class="field"><label for="fType">Event type</label><select id="fType">${typeOptions}</select></div>

      <h3>When and where</h3>
      <div class="form-grid">
        <div class="field"><label for="fDate">Date</label><input id="fDate" type="date" min="${today}" required></div>
        <div class="field"><label for="fLocation">Location</label><input id="fLocation" required></div>
        <div class="field"><label for="fStart">Start time</label><input id="fStart" type="time" required></div>
        <div class="field"><label for="fEnd">End time</label><input id="fEnd" type="time" required></div>
      </div>

      <h3>Registration</h3>
      <div class="field small"><label for="fCapacity">Capacity (seats)</label><input id="fCapacity" type="number" min="1" required></div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="goTo('events')">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Event</button>
      </div>
    </form>`;
}


/* ---------- 5. Manage one event ---------- */

function manageEvent() {
  const ev = getEvent(selectedId);
  const type = eventTypes[ev.type];
  const regs = data.registrations.filter(reg => reg.eventId === ev.id);
  const tasks = tasksOf(ev.id);
  const stalls = stallsOf(ev.id);

  return `
    ${backLink("events", "Back to events")}
    <div class="event-hero card-${type.color}">
      <div class="icon-tile solid big">${icon(type.icon)}</div>
      <div>
        <h1>${clean(ev.title)} ${badge(eventStatus(ev))}</h1>
        <div class="meta-row">${eventMeta(ev)}</div>
      </div>
    </div>

    <div class="kpi-row three">
      ${kpiCard("ticket", "blue", "Registrations", regs.length + " / " + ev.capacity, regs.filter(r => r.checkedIn).length + " checked in")}
      ${kpiCard("clipboard-check", "violet", "Volunteer Tasks", tasks.filter(t => t.status === "Completed").length + " / " + tasks.length, "Tasks completed")}
      ${kpiCard("store", "peach", "Vendor Stalls", stalls.filter(s => s.status === "Ready").length + " / " + stalls.length, "Stalls ready")}
    </div>

    <section class="panel"><div class="section-head"><h2>Attendees</h2></div>${registrationsTable(regs)}</section>
    <section class="panel"><div class="section-head"><h2>Volunteer Tasks</h2></div>${tasksTable(tasks)}</section>
    <section class="panel"><div class="section-head"><h2>Vendor Stalls</h2></div>${stallsTable(stalls)}</section>`;
}


/* ---------- 6. Attendees page ---------- */

function attendees() {
  return `
    ${pageHead("Attendees", "Everyone registered for a campus event.")}
    <section class="panel">${registrationsTable(data.registrations)}</section>`;
}

function registrationsTable(regs) {
  const list = regs.filter(reg => matches(reg.name + reg.id + getEvent(reg.eventId).title));
  if (list.length === 0) return emptyState("users-round", "No registrations yet.");

  let rows = "";
  for (const reg of list) {
    rows += `
      <tr>
        <td><div class="person"><span class="avatar small">${initials(reg.name)}</span><strong>${clean(reg.name)}</strong></div></td>
        <td>${clean(getEvent(reg.eventId).title)}</td>
        <td><code>${reg.id}</code></td>
        <td>${badge(reg.checkedIn ? "Checked In" : "Registered")}</td>
      </tr>`;
  }
  return `
    <div class="table-wrap"><table>
      <thead><tr><th>Attendee</th><th>Event</th><th>Registration ID</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}


/* ---------- 7. Volunteers page (add + list tasks) ---------- */

// Drop-down list of all events (used in the "add task" and "add stall" forms)
function eventOptions() {
  return data.events.map(ev => `<option value="${ev.id}">${clean(ev.title)}</option>`).join("");
}

function volunteers() {
  return `
    ${pageHead("Volunteers", "Create tasks for events and follow their progress.")}

    <form class="panel form" onsubmit="addTask(event)">
      <h3>Add a volunteer task</h3>
      <div class="form-grid four">
        <div class="field"><label for="tEvent">Event</label><select id="tEvent">${eventOptions()}</select></div>
        <div class="field"><label for="tTitle">Task title</label><input id="tTitle" placeholder="e.g. Registration Desk" required></div>
        <div class="field"><label for="tTime">Duty time</label><input id="tTime" placeholder="e.g. 9:00 AM - 11:00 AM" required></div>
        <div class="field"><label for="tLocation">Location</label><input id="tLocation" required></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary">${icon("plus")} Add Task</button></div>
    </form>

    <section class="panel"><div class="section-head"><h2>All Tasks</h2></div>${tasksTable(data.tasks)}</section>`;
}

function tasksTable(tasks) {
  const list = tasks.filter(task => matches(task.title + getEvent(task.eventId).title));
  if (list.length === 0) return emptyState("clipboard-list", "No volunteer tasks for this event yet.");

  let rows = "";
  for (const task of list) {
    rows += `
      <tr>
        <td><strong>${clean(task.title)}</strong><span class="sub">${clean(task.location)}</span></td>
        <td>${clean(getEvent(task.eventId).title)}</td>
        <td>${clean(task.time)}</td>
        <td>${task.volunteer === "" ? `<span class="muted">Unassigned</span>` : clean(task.volunteer)}</td>
        <td>${badge(task.volunteer === "" ? "Available" : task.status)}</td>
      </tr>`;
  }
  return `
    <div class="table-wrap"><table>
      <thead><tr><th>Task</th><th>Event</th><th>Time</th><th>Volunteer</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}


/* ---------- 8. Vendors page (add + list stalls) ---------- */

function vendors() {
  return `
    ${pageHead("Vendors", "Create stalls for events and follow their setup.")}

    <form class="panel form" onsubmit="addStall(event)">
      <h3>Add a vendor stall</h3>
      <div class="form-grid four">
        <div class="field"><label for="sEvent">Event</label><select id="sEvent">${eventOptions()}</select></div>
        <div class="field"><label for="sName">Stall name</label><input id="sName" placeholder="e.g. Stall C1" required></div>
        <div class="field"><label for="sCategory">Category</label><input id="sCategory" placeholder="e.g. Food" required></div>
        <div class="field"><label for="sLocation">Location</label><input id="sLocation" required></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary">${icon("plus")} Add Stall</button></div>
    </form>

    <section class="panel"><div class="section-head"><h2>All Stalls</h2></div>${stallsTable(data.stalls)}</section>`;
}

function stallsTable(stalls) {
  const list = stalls.filter(stall => matches(stall.name + stall.category + getEvent(stall.eventId).title));
  if (list.length === 0) return emptyState("store", "No vendor stalls for this event yet.");

  let rows = "";
  for (const stall of list) {
    rows += `
      <tr>
        <td><strong>${clean(stall.name)}</strong><span class="sub">${clean(stall.category)}</span></td>
        <td>${clean(getEvent(stall.eventId).title)}</td>
        <td>${clean(stall.location)}</td>
        <td>${stall.vendor === "" ? `<span class="muted">Unclaimed</span>` : clean(stall.vendor)}</td>
        <td>${badge(stall.vendor === "" ? "Available" : stall.status)}</td>
      </tr>`;
  }
  return `
    <div class="table-wrap"><table>
      <thead><tr><th>Stall</th><th>Event</th><th>Location</th><th>Vendor</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}


/* ---------- 9. Admin actions (what the buttons do) ---------- */

function saveEvent(e) {
  e.preventDefault(); // stop the form from reloading the page

  if (value("fEnd") <= value("fStart")) {
    showToast("End time must be after the start time.", "error");
    return;
  }

  const title = value("fTitle");
  data.events.push({
    id: nextId(data.events),
    title: title,
    type: value("fType"),
    description: value("fDesc"),
    date: value("fDate"),
    start: value("fStart"),
    end: value("fEnd"),
    location: value("fLocation"),
    capacity: Number(value("fCapacity"))
  });
  saveData();
  showToast("Event created: " + title);
  goTo("events");
}

function deleteEvent(id) {
  const ev = getEvent(id);
  if (!confirm("Delete \"" + ev.title + "\"? Its registrations, tasks and stalls will be removed too.")) return;

  // Keep everything that does NOT belong to this event
  data.events = data.events.filter(item => item.id !== id);
  data.registrations = data.registrations.filter(item => item.eventId !== id);
  data.tasks = data.tasks.filter(item => item.eventId !== id);
  data.stalls = data.stalls.filter(item => item.eventId !== id);
  saveData();
  showToast("Event deleted: " + ev.title);
  render();
}

function addTask(e) {
  e.preventDefault();
  data.tasks.push({
    id: nextId(data.tasks),
    eventId: Number(value("tEvent")),
    title: value("tTitle"),
    time: value("tTime"),
    location: value("tLocation"),
    volunteer: "",
    status: "To Do"
  });
  saveData();
  showToast("Task added: " + value("tTitle"));
  render();
}

function addStall(e) {
  e.preventDefault();
  data.stalls.push({
    id: nextId(data.stalls),
    eventId: Number(value("sEvent")),
    name: value("sName"),
    category: value("sCategory"),
    location: value("sLocation"),
    vendor: "",
    status: "Not Started"
  });
  saveData();
  showToast("Stall added: " + value("sName"));
  render();
}


/* ---------- 10. Tell the app about the Admin pages ---------- */

pages.adminHome = adminHome;
pages.events = events;
pages.createEvent = createEvent;
pages.manageEvent = manageEvent;
pages.attendees = attendees;
pages.volunteers = volunteers;
pages.vendors = vendors;
