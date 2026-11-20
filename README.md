# CampusConnect

**Campus Events, Made Simple.** CampusConnect is a web app for managing university events. You sign in with one of four roles:

| Role | What you can do |
|------|-----------------|
| **Admin** | Create and manage events |
| **Attendee** | Find events and register for them |
| **Volunteer** | Claim tasks and mark them done |
| **Vendor** | Manage event stalls |

It is plain HTML, CSS and JavaScript. There is no build step and no backend. Data is saved in your browser's `localStorage`.

## Getting started

### 1. Clone the repository

```bash
git clone git@github.com:shahid4003/haseeb-project.git
cd haseeb-project
```

### 2. Run the app

**Option A: open the file directly**

Double-click `index.html`, or open it from the terminal:

```bash
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

**Option B: use a local web server (recommended)**

```bash
# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

Then go to <http://localhost:8000> in your browser. If you use `npx serve`, it prints its own port, usually 3000.

### 3. Sign in

Type your name, pick a role and sign in. You'll go to the dashboard for that role. No password is needed.

> The page needs internet access to load the Inter font and the Lucide icons from a CDN.

## Project structure

```
├── index.html        # Sign-in page (name + role)
├── dashboard.html    # Main dashboard, shared by all roles
├── style.css         # Styles
├── data.js           # Sample data, plus save/load to localStorage
├── app.js            # Shared app logic (session, navigation, reset)
├── admin.js          # Admin view
├── attendee.js       # Attendee view
├── volunteer.js      # Volunteer view
├── vendor.js         # Vendor view
├── logo.jpg / logo-icon.jpg
└── presentation/     # Slides, project guide (PDF) and demo video
```

## Resetting the data

The first time you open the app, it loads sample events. Any changes you make are saved in your browser. To go back to the sample data, click **Reset demo data** in the dashboard. You can also clear the site's `localStorage` (the `ccData` and `ccUser` keys) in your browser's developer tools.
