/* =========================================================
   CampusConnect - attendee.js  (ROLE 2: ATTENDEE)
   The Attendee discovers events, registers for them
   and gets a ticket with a Registration ID.
   ========================================================= */


/* ---------- 1. Attendee menu, top button and search hint ---------- */

roles.attendee = {
  menu: [
    { page: "discover",        label: "Discover Events",  icon: "compass" },
    { page: "myRegistrations", label: "My Registrations", icon: "ticket" }
  ],
  action: { label: "Browse Events", icon: "compass", page: "discover" },
  searchHint: "Search events..."
};


/* ---------- 2. Helper: am I registered for this event? ---------- */

// Returns my registration for the event, or undefined if I am not registered
function myRegistration(eventId) {
  return data.registrations.find(reg => reg.eventId === eventId && reg.name === user.name);
}

// All my registrations
function myRegistrationsList() {
  return data.registrations.filter(reg => reg.name === user.name);
}

// Next registration ID, e.g. "CC-1007"
function nextRegistrationId() {
  let biggest = 1000;
  for (const reg of data.registrations) {
    const number = Number(reg.id.slice(3)); // "CC-1007" -> 1007
    if (number > biggest) biggest = number;
  }
  return "CC-" + (biggest + 1);
}


/* ---------- 3. Discover Events page ---------- */

function discover() {
  return `
    ${pageHead(greeting() + ", " + clean(user.name), "Discover what is happening on campus and save your seat.")}

    <section>
      <div class="section-head"><h2>Upcoming Events</h2></div>
      ${attendeeEventGrid(upcomingEvents())}
    </section>

    <section class="panel">
      <div class="section-head">
        <h2>My Registrations</h2>
        <button class="btn-link" onclick="goTo('myRegistrations')">See all</button>
      </div>
      ${registrationRows()}
    </section>`;
}

// Event cards for the Attendee show how many seats are taken
function attendeeEventGrid(events) {
  const list = events.filter(ev => matches(ev.title + ev.location));
  if (list.length === 0) return emptyState("search-x", "No events match your search.");

  let html = `<div class="event-grid">`;
  for (const ev of list) {
    const taken = seatsTaken(ev.id);
    const button = `<button class="btn-link" onclick="goTo('eventDetail', ${ev.id})">View Details ${icon("arrow-right")}</button>`;
    html += eventCard(ev, `${taken} / ${ev.capacity} seats taken`, taken, ev.capacity, button);
  }
  return html + `</div>`;
}


/* ---------- 4. Event Detail page ---------- */

function eventDetail() {
  const ev = getEvent(selectedId);
  const type = eventTypes[ev.type];
  const taken = seatsTaken(ev.id);
  const reg = myRegistration(ev.id);

  // Choose the right button:
  //  - already registered -> "View My Ticket"
  //  - no seats left      -> "Event Full" (disabled)
  //  - otherwise          -> "Register Now"
  let action;
  if (reg) {
    action = `${badge("Registered")}
      <button class="btn btn-secondary btn-big" onclick="goTo('ticket', '${reg.id}')">${icon("ticket")} View My Ticket</button>`;
  } else if (taken >= ev.capacity) {
    action = `<button class="btn btn-big" disabled>Event Full</button>`;
  } else {
    action = `<button class="btn btn-primary btn-big" onclick="registerForEvent(${ev.id})">Register Now</button>`;
  }

  return `
    ${backLink("discover", "Back to events")}
    <div class="detail">
      <div class="cover card-${type.color}">${icon(type.icon)}</div>
      <div class="panel detail-body">
        <span class="type-label">${type.label}</span>
        <h1>${clean(ev.title)}</h1>
        <p class="description">${clean(ev.description)}</p>
        <div class="meta-row">${eventMeta(ev)}</div>
        <p class="progress-label">${taken} / ${ev.capacity} seats taken</p>
        ${progressBar(taken, ev.capacity)}
        <div class="detail-action">${action}</div>
      </div>
    </div>`;
}


/* ---------- 5. My Registrations page ---------- */

function myRegistrations() {
  return `
    ${pageHead("My Registrations", "Your tickets for campus events.")}
    <section class="panel">${registrationRows()}</section>`;
}

// One row per registration (used here and on the Discover page)
function registrationRows() {
  const mine = myRegistrationsList();
  if (mine.length === 0) {
    return emptyState("ticket", "You have not registered for any events yet.") +
      `<div class="center"><button class="btn btn-primary" onclick="goTo('discover')">Browse Events</button></div>`;
  }

  let html = `<div class="list">`;
  for (const reg of mine) {
    const ev = getEvent(reg.eventId);
    const type = eventTypes[ev.type];
    html += `
      <div class="list-row">
        <div class="icon-tile tile-${type.color}">${icon(type.icon)}</div>
        <div class="grow">
          <strong>${clean(ev.title)}</strong>
          <span class="sub">${formatDate(ev.date)} · ${clean(ev.location)} · <code>${reg.id}</code></span>
        </div>
        ${badge(reg.checkedIn ? "Checked In" : "Registered")}
        <button class="btn-link" onclick="goTo('ticket', '${reg.id}')">View Ticket</button>
      </div>`;
  }
  return html + `</div>`;
}


/* ---------- 6. Ticket page ---------- */

function ticket() {
  const reg = data.registrations.find(r => r.id === selectedId);
  const ev = getEvent(reg.eventId);

  return `
    ${backLink("myRegistrations", "Back to my registrations")}
    <div class="ticket">
      <div class="ticket-top card-${eventTypes[ev.type].color}">
        <span class="type-label">CampusConnect Ticket</span>
        <h1>${clean(ev.title)}</h1>
        ${badge(reg.checkedIn ? "Checked In" : "Registered")}
      </div>
      <div class="ticket-body">
        ${eventMeta(ev)}
        <div class="ticket-row"><span>Attendee</span><strong>${clean(reg.name)}</strong></div>
        <div class="ticket-row">
          <span>Registration ID</span>
          <div class="reg-id">
            <code>${reg.id}</code>
            <button class="btn btn-secondary btn-small" onclick="copyId('${reg.id}')">${icon("copy")} Copy</button>
          </div>
        </div>
        <p class="hint">Show this ID at the registration desk on the event day.</p>
      </div>
    </div>`;
}


/* ---------- 7. Attendee actions (what the buttons do) ---------- */

function registerForEvent(eventId) {
  data = loadData(); // get the newest data first (seats may have changed)
  const ev = getEvent(eventId);

  // Check 1: already registered?
  if (myRegistration(eventId)) {
    showToast("You are already registered for this event.", "error");
    render();
    return;
  }

  // Check 2: any seats left?
  if (seatsTaken(eventId) >= ev.capacity) {
    showToast("Sorry, this event is now full.", "error");
    render();
    return;
  }

  // All good: create the registration and save it
  const reg = { id: nextRegistrationId(), eventId: eventId, name: user.name, checkedIn: false };
  data.registrations.push(reg);
  saveData();
  showToast("You're registered for " + ev.title + ".");
  goTo("ticket", reg.id); // show the new ticket
}

// Copy the Registration ID so the user can paste it anywhere
function copyId(id) {
  navigator.clipboard.writeText(id)
    .then(() => showToast("Registration ID copied: " + id))
    .catch(() => showToast("Could not copy. Your ID is " + id, "error"));
}


/* ---------- 8. Tell the app about the Attendee pages ---------- */

pages.discover = discover;
pages.eventDetail = eventDetail;
pages.myRegistrations = myRegistrations;
pages.ticket = ticket;
