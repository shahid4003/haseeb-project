/* =========================================================
   CampusConnect - data.js
   This file holds all the app data and the functions
   that save and load it from the browser (localStorage).
   ========================================================= */

// Sample data: used the very first time the app is opened.
const sampleData = {
  events: [
    {
      id: 1, title: "University Tech Fest", type: "tech",
      date: "2026-11-20", start: "09:00", end: "17:00",
      location: "Main Auditorium", capacity: 50,
      description: "A full day of coding competitions, robotics demos and talks from industry speakers."
    },
    {
      id: 2, title: "Career Fair 2026", type: "career",
      date: "2026-11-26", start: "10:00", end: "16:00",
      location: "Sports Complex Hall", capacity: 120,
      description: "Meet recruiters from top companies, share your CV and learn about internships."
    },
    {
      id: 3, title: "Cultural Night", type: "social",
      date: "2026-12-04", start: "18:00", end: "22:00",
      location: "Central Lawn", capacity: 200,
      description: "Music, food and performances celebrating the cultures of our campus."
    },
    {
      id: 4, title: "Community Clean-Up Drive", type: "community",
      date: "2026-12-12", start: "08:00", end: "11:00",
      location: "Campus Gate 2", capacity: 3,
      description: "Join fellow students to clean and green the area around our campus."
    },
    {
      id: 5, title: "Inter-Department Cricket Cup", type: "sports",
      date: "2026-12-18", start: "13:00", end: "18:00",
      location: "University Ground", capacity: 300,
      description: "Cheer for your department in the annual cricket tournament final."
    }
  ],

  // A registration links an attendee (by name) to an event.
  registrations: [
    { id: "CC-1001", eventId: 1, name: "Ahmed Khan", checkedIn: false },
    { id: "CC-1002", eventId: 1, name: "Sara Ali", checkedIn: true },
    { id: "CC-1003", eventId: 2, name: "Ahmed Khan", checkedIn: false },
    { id: "CC-1004", eventId: 4, name: "Bilal Hussain", checkedIn: false },
    { id: "CC-1005", eventId: 4, name: "Ayesha Noor", checkedIn: false },
    { id: "CC-1006", eventId: 4, name: "Hamza Raza", checkedIn: false }
  ],

  // volunteer: "" means nobody has claimed the task yet.
  tasks: [
    { id: 1, eventId: 1, title: "Registration Desk", time: "08:30 AM - 12:00 PM", location: "Auditorium Entrance", volunteer: "", status: "To Do" },
    { id: 2, eventId: 1, title: "Stage Setup", time: "07:30 AM - 09:00 AM", location: "Main Stage", volunteer: "Usman Tariq", status: "Completed" },
    { id: 3, eventId: 1, title: "Guest Speaker Help", time: "10:00 AM - 01:00 PM", location: "Green Room", volunteer: "Usman Tariq", status: "In Progress" },
    { id: 4, eventId: 2, title: "Registration Desk", time: "09:30 AM - 01:00 PM", location: "Hall Entrance", volunteer: "", status: "To Do" },
    { id: 5, eventId: 3, title: "Food Stall Coordination", time: "05:00 PM - 08:00 PM", location: "Central Lawn", volunteer: "", status: "To Do" }
  ],

  // vendor: "" means the stall is still available.
  stalls: [
    { id: 1, eventId: 1, name: "Stall A1", category: "Food", location: "Auditorium Lobby", vendor: "", status: "Not Started" },
    { id: 2, eventId: 1, name: "Stall A2", category: "Tech Gadgets", location: "Auditorium Lobby", vendor: "Zain Traders", status: "Setting Up" },
    { id: 3, eventId: 3, name: "Stall B1", category: "Food", location: "Central Lawn", vendor: "", status: "Not Started" },
    { id: 4, eventId: 3, name: "Stall B2", category: "Handicrafts", location: "Central Lawn", vendor: "", status: "Not Started" }
  ]
};

// Load saved data. If nothing is saved yet, use a copy of the sample data.
function loadData() {
  const saved = localStorage.getItem("ccData");
  if (saved) {
    return JSON.parse(saved);
  }
  return JSON.parse(JSON.stringify(sampleData)); // makes a fresh copy
}

// Save the current data so it is still there after a page refresh.
function saveData() {
  localStorage.setItem("ccData", JSON.stringify(data));
}

// Go back to the original sample data.
function resetData() {
  localStorage.removeItem("ccData");
  data = loadData();
}

// The data the whole app works with.
let data = loadData();
