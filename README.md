# 🏴‍☠️ Induction Treasure Hunt

A real-time, mobile-first **campus treasure hunt** web application built for college induction programs. Teams race across campus scanning QR codes at checkpoints, earning points, and competing on a live leaderboard — all from their smartphones.

<p align="center">
  <img src="docs/campus-map.jpg" alt="Campus treasure map" width="500" />
</p>

---

## ✨ Features

### 🎯 For Players (Teams)
- **Simple Login** — Join with a 6-character team access code. No email or password needed.
- **QR Code Scanner** — Tap the floating camera button to scan checkpoint QR codes using your phone camera.
- **Live Score & Progress** — See your points, checkpoint progress bar, and next destination clue in real time.
- **Lifelines** — Stuck? Buy a **Hint** or **Skip** a checkpoint at a point cost. The server blocks lifeline usage if your score would drop below the minimum threshold.
- **Confetti Celebration** — Canvas confetti bursts on every successful checkpoint scan.
- **Final Clue Security** — The final destination is locked until you've completed every checkpoint AND have enough points.

### 📊 Live Leaderboard
- Real-time rank updates via **Socket.io** — no page refresh needed.
- 🥇🥈🥉 Medal indicators for top 3 teams.
- Highlight animation when a team's score changes.

### 🛡️ Admin Command Panel
- **Team Management** — Create teams (auto-generated access codes), reset scores, full progress reset, or delete teams.
- **Checkpoint Builder** — Create checkpoints with title, clue text, point rewards, bonus hints, and sequence order.
- **Printable QR Cards** — Each checkpoint generates a QR code. Hit "Print QR cards" for printer-friendly output.
- **QR Token Rotation** — Rotate a checkpoint's secret QR token instantly if compromised.
- **Live Dashboard** — Team scores update in real time via Socket.io.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Backend** | Node.js, Express, Custom `server.js` |
| **Database** | MongoDB with Mongoose |
| **Real-Time** | Socket.io (WebSocket) |
| **QR Scanner** | `html5-qrcode` (native camera access) |
| **QR Generator** | `qrcode.react` (SVG rendering) |
| **Icons** | Lucide React |
| **Effects** | Canvas Confetti |

---

## 📂 Project Structure

```
induction-treasure-hunt/
├── app/
│   ├── api/
│   │   ├── auth/login/route.js      # Team authentication
│   │   ├── scan/route.js            # QR scan → atomic score update
│   │   ├── lifeline/route.js        # Hint/Skip with threshold guard
│   │   ├── leaderboard/route.js     # GET leaderboard data
│   │   ├── progress/route.js        # GET team progress
│   │   └── admin/manage/route.js    # Full admin CRUD operations
│   ├── login/page.jsx               # Team login screen
│   ├── dashboard/page.jsx           # Player dashboard (scanner + lifelines)
│   ├── leaderboard/page.jsx         # Live leaderboard
│   ├── admin/page.jsx               # Admin command panel
│   ├── layout.jsx                   # Root layout with viewport config
│   ├── globals.css                  # Tailwind + dark theme + print styles
│   └── page.jsx                     # Redirects to /login
├── components/
│   ├── QRScannerModal.jsx           # Camera QR scanner (html5-qrcode)
│   ├── LifelineModal.jsx            # Points warning + lifeline trigger
│   ├── LeaderboardRow.jsx           # Animated leaderboard row
│   └── AdminDashboard.jsx           # Full admin interface + QR cards
├── hooks/
│   └── useSocket.js                 # Socket.io React hook with cleanup
├── lib/
│   ├── dbConnect.js                 # Mongoose cached connection
│   ├── gameConfig.js                # Game rules + serializers
│   ├── io.js                        # Global Socket.io accessor
│   ├── progress.js                  # Progress builder + leaderboard emitter
│   └── models/
│       ├── Team.js                  # Team schema (score, checkpoints, lifelines)
│       ├── Checkpoint.js            # Checkpoint schema (token, reward, clue)
│       └── ScanLog.js               # Audit log for scans & lifelines
├── server.js                        # Express + Socket.io + Next.js unified server
├── package.json
├── .env.local                       # Environment variables (DO NOT COMMIT)
├── .env.example                     # Template for environment variables
├── tailwind.config.js
├── next.config.js
├── postcss.config.js
└── jsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **MongoDB** running locally or a MongoDB Atlas connection string

### 1. Clone & Install

```bash
git clone https://github.com/your-username/induction-treasure-hunt.git
cd induction-treasure-hunt
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/induction-treasure-hunt
ADMIN_PASSKEY=your-secret-admin-key
MIN_POINTS_THRESHOLD=50
HINT_COST=10
SKIP_COST=25
FINAL_CLUE=The final gathering is at the Main Auditorium. Show this screen to a volunteer.
PORT=3000
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `ADMIN_PASSKEY` | Secret key to access the admin panel |
| `MIN_POINTS_THRESHOLD` | Minimum points required; lifelines cannot drop score below this |
| `HINT_COST` | Points deducted when a team uses the Hint lifeline |
| `SKIP_COST` | Points deducted when a team skips a checkpoint |
| `FINAL_CLUE` | The message shown when all checkpoints are done and threshold is met |
| `PORT` | Server port (default: 3000) |

### 3. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

Open **http://localhost:3000** on your phone or browser.

---

## 📱 How to Play

### Setting Up (Admin)

1. Go to `/admin` and enter the `ADMIN_PASSKEY`.
2. **Create Checkpoints** — Add checkpoint locations with clues, point rewards, and bonus hints. QR codes are auto-generated.
3. **Print QR Cards** — Switch to the "Checkpoints & QR" tab and click "Print QR cards". Place printed QR codes at physical locations around campus.
4. **Create Teams** — Add team names. Each team gets a unique 6-character access code.
5. Distribute the access codes to participating teams.

### Playing (Teams)

1. Open the app on your phone and go to `/login`.
2. Enter your team's **6-character access code**.
3. Read the **clue** for your next destination.
4. Find the location and **scan the QR code** using the floating camera button.
5. Earn points! 🎉 Watch the confetti and check the leaderboard.
6. **Stuck?** Use a lifeline:
   - **Hint** (−10 pts) — Reveals an extra clue.
   - **Skip** (−25 pts) — Skips the current checkpoint entirely.
7. Complete all checkpoints to unlock the **final destination clue**.

---

## 🔒 Security & Game Integrity

### Anti-Cheat: Atomic Double-Scan Prevention

The scan endpoint uses MongoDB's atomic `findOneAndUpdate` with a `$ne` filter to guarantee a checkpoint can only be scored **once per team**, even under race conditions:

```javascript
Team.findOneAndUpdate(
  {
    _id: team._id,
    'completedCheckpoints.checkpointId': { $ne: checkpoint._id },
  },
  {
    $inc: { score: checkpoint.pointsReward },
    $push: { completedCheckpoints: { checkpointId: checkpoint._id } },
  },
  { new: true }
);
```

### Lifeline Threshold Guard

Lifelines are blocked at **both** the application layer and the database layer. The server checks `team.score - cost < MIN_POINTS_THRESHOLD` before processing, and the MongoDB query includes `score: { $gte: cost + MIN_POINTS_THRESHOLD }` as an atomic guard.

### Final Clue Lock

The final clue is only revealed when **both** conditions are met:
- `completedCheckpoints.length === totalCheckpoints`
- `team.score >= MIN_POINTS_THRESHOLD`

### Audit Trail

Every scan and lifeline usage is logged in the `ScanLog` collection with timestamps, point deltas, and metadata for dispute resolution.

---

## 🌐 Real-Time Architecture

```
┌─────────────┐     Socket.io      ┌──────────────────┐
│  Player      │◄──────────────────►│                  │
│  Dashboard   │   leaderboard_     │   Node.js Server │
│  /dashboard  │   update           │   (server.js)    │
├─────────────┤                    │                  │
│  Leaderboard │◄──────────────────►│  Express + Next  │
│  /leaderboard│   join_leaderboard │  + Socket.io     │
├─────────────┤                    │                  │
│  Admin Panel │◄──────────────────►│                  │
│  /admin      │   leaderboard_     └────────┬─────────┘
└─────────────┘   update                     │
                                             │ Mongoose
                                    ┌────────▼─────────┐
                                    │     MongoDB       │
                                    │  Teams,           │
                                    │  Checkpoints,     │
                                    │  ScanLogs         │
                                    └──────────────────┘
```

- **`leaderboard_update`** — Emitted when any team's score changes (scan, lifeline, admin reset).
- **`leaderboard_full`** — Emitted when a team is deleted, sending the full updated list.
- **`join_leaderboard`** — Clients join a Socket.io room to receive score broadcasts.

---

## 🖨️ Printing QR Cards

1. Navigate to `/admin` → **Checkpoints & QR** tab.
2. Click the **"Print QR cards"** button.
3. The page uses `@media print` styles to:
   - Hide all admin controls
   - Render QR cards in a clean 2-column grid
   - Prevent cards from splitting across pages

> **Tip**: Print to PDF first, then print physical copies. Laminate them for outdoor use!

---

## 🛠️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate with `accessCode` |
| `POST` | `/api/scan` | Submit scanned QR token + `accessCode` |
| `POST` | `/api/lifeline` | Use HINT or SKIP lifeline |
| `GET`  | `/api/progress?accessCode=...` | Get team progress & next clue |
| `GET`  | `/api/leaderboard` | Get sorted leaderboard |
| `POST` | `/api/admin/manage` | Admin operations (requires `x-admin-passkey` header) |

### Admin Actions

| Action | Description |
|--------|-------------|
| `login` | Validate admin passkey |
| `listTeams` | List all teams with scores |
| `listCheckpoints` | List all checkpoints |
| `listLogs` | List recent scan/lifeline logs |
| `createTeam` | Create team with auto-generated access code |
| `createCheckpoint` | Create checkpoint with auto-generated QR token |
| `updateCheckpoint` | Update checkpoint details |
| `resetScore` | Set a team's score to a specific value |
| `resetProgress` | Reset score, checkpoints, and lifelines |
| `deleteTeam` | Permanently delete a team and its logs |
| `deleteCheckpoint` | Delete a checkpoint |
| `rotateToken` | Generate a new QR secret token |
| `leaderboard` | Get public leaderboard data |

---

## 📄 License

This project is built for educational purposes as part of a college induction program.

---

<p align="center">
  Built with ❤️ for NIELIT Induction 2026
</p>
