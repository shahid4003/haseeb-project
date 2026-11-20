/* =========================================================
   CampusConnect - vendor.js  (ROLE 4: VENDOR)
   The Vendor claims a stall at an event and updates
   its setup status: Not Started -> Setting Up -> Ready.
   ========================================================= */


/* ---------- 1. Vendor menu, top button and search hint ---------- */

roles.vendor = {
  menu: [
    { page: "vendorHome",      label: "Overview",         icon: "layout-dashboard" },
    { page: "availableStalls", label: "Available Stalls", icon: "store" },
    { page: "myStalls",        label: "My Stalls",        icon: "package" }
  ],
  action: { label: "Claim Stall", icon: "plus", page: "availableStalls" },
  searchHint: "Search stalls..."
};


/* ---------- 2. Helpers ---------- */

// Stalls claimed by the logged-in vendor
function myStalls() {
  return data.stalls.filter(stall => stall.vendor === user.name);
}

// Stalls nobody has claimed yet
function openStalls() {
  return data.stalls.filter(stall => stall.vendor === "");
}


/* ---------- 3. Overview page ---------- */

function vendorHome() {
  const mine = myStalls();
  return `
    ${pageHead(greeting() + ", " + clean(user.name), "Your campus stall activity.")}

    <div class="kpi-row three">
      ${kpiCard("store", "peach", "My Stalls", mine.length, "Claimed by you")}
      ${kpiCard("hammer", "blue", "Setting Up", mine.filter(s => s.status === "Setting Up").length, "In preparation")}
      ${kpiCard("circle-check", "aqua", "Ready", mine.filter(s => s.status === "Ready").length, "Open for visitors")}
    </div>

    <section>
      <div class="section-head"><h2>My Stalls</h2></div>
      ${stallGrid(mine, "You have not claimed any stalls yet.")}
    </section>

    <section>
      <div class="section-head">
        <h2>Available Stalls</h2>
        <button class="btn-link" onclick="goTo('availableStalls')">See all</button>
      </div>
      ${stallGrid(openStalls().slice(0, 3), "All stalls are claimed.")}
    </section>`;
}


/* ---------- 4. Available Stalls and My Stalls pages ---------- */

function availableStalls() {
  return `
    ${pageHead("Available Stalls", "Choose a free stall for your business and claim it.")}
    ${stallGrid(openStalls(), "All stalls for every event are claimed.")}`;
}

function myStallsPage() {
  return `
    ${pageHead("My Stalls", "Update your stall as you set it up.")}
    ${stallGrid(myStalls(), "You have not claimed any stalls yet.")}`;
}

// A grid of stall cards (with search filter and empty message)
function stallGrid(stalls, emptyText) {
  const list = stalls.filter(stall => matches(stall.name + stall.category + getEvent(stall.eventId).title));
  if (list.length === 0) return emptyState("store", emptyText);
  return `<div class="item-grid">${list.map(stallCard).join("")}</div>`;
}

// One stall card. The button changes with the stall's status:
//   not claimed -> Claim Stall
//   Not Started -> Start Setup
//   Setting Up  -> Mark Ready
//   Ready       -> "Ready for visitors"
function stallCard(stall) {
  const ev = getEvent(stall.eventId);
  const claimed = stall.vendor !== "";
  let action;

  if (!claimed) {
    action = `<button class="btn btn-primary btn-small" onclick="claimStall(${stall.id})">Claim Stall</button>`;
  } else if (stall.status === "Not Started") {
    action = `<button class="btn btn-primary btn-small" onclick="setStallStatus(${stall.id}, 'Setting Up')">Start Setup</button>`;
  } else if (stall.status === "Setting Up") {
    action = `<button class="btn btn-primary btn-small" onclick="setStallStatus(${stall.id}, 'Ready')">Mark Ready</button>`;
  } else {
    action = `<span class="done-text">${icon("circle-check")} Ready for visitors</span>`;
  }

  return `
    <div class="item-card">
      <div class="item-top">
        <div class="icon-tile tile-peach">${icon("store")}</div>
        ${badge(claimed ? stall.status : "Available")}
      </div>
      <h3>${clean(stall.name)} <span class="sub inline">· ${clean(stall.category)}</span></h3>
      <p class="meta">${icon("calendar-days")} ${clean(ev.title)} · ${formatDate(ev.date)}</p>
      <p class="meta">${icon("map-pin")} ${clean(stall.location)}</p>
      ${claimed ? steps(["Not Started", "Setting Up", "Ready"], stall.status) : ""}
      <div class="item-foot">${action}</div>
    </div>`;
}


/* ---------- 5. Vendor actions (what the buttons do) ---------- */

function claimStall(stallId) {
  data = loadData(); // get the newest data: someone else may have claimed it
  const stall = data.stalls.find(s => s.id === stallId);

  if (stall.vendor !== "") {
    showToast("Sorry, this stall was already claimed by someone else.", "error");
  } else {
    stall.vendor = user.name;
    stall.status = "Not Started";
    saveData();
    showToast("Stall claimed: " + stall.name);
  }
  render();
}

function setStallStatus(stallId, newStatus) {
  const stall = data.stalls.find(s => s.id === stallId);
  stall.status = newStatus;
  saveData();
  showToast(stall.name + " is now " + newStatus + ".");
  render();
}


/* ---------- 6. Tell the app about the Vendor pages ---------- */

pages.vendorHome = vendorHome;
pages.availableStalls = availableStalls;
pages.myStalls = myStallsPage;
