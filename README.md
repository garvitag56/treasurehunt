# 🏴‍☠️ Induction Treasure Hunt

A real-time, mobile-first **campus treasure hunt** web application built for a college induction program. Teams race across campus scanning QR codes at checkpoints, collecting letters from volunteers, and competing on a live leaderboard — all from their smartphones.

### 🔗 [Live App → treasurehunt-nielitcpsn.vercel.app](https://treasurehunt-nielitcpsn.vercel.app/)

<p align="center">
  <img src="docs/campus-map.jpg" alt="Campus treasure map" width="480" />
</p>

---

## ✨ Features

### 🎯 For Players (Teams)
- **Simple Login** — Join with a 6-character team access code. No email or password needed.
- **QR Code Scanner** — Tap the floating camera button to scan checkpoint QR codes using your phone's camera.
- **Live Score & Progress** — See your points, checkpoint progress bar, and status updates in real time via Socket.io.
- **Letter Collection** — Each checkpoint gives you a letter from a volunteer. Collect them all to form the final password.
- **Hint Lifeline** — Stuck? Buy a **Hint** for a point cost (−10 pts by default).
- **Final Password Unlock** — Once eligible, enter the secret password to reveal the final riddle.
- **Confetti Celebration** — Canvas confetti bursts on every successful checkpoint scan.
- **Campus Map** — Toggle the campus map directly from the dashboard while hunting.

### 📊 Live Leaderboard
- Real-time rank updates via **Socket.io** — no page refresh needed.
- 🥇🥈🥉 Medal indicators for top 3 teams.
- Progress bars showing checkpoint completion per team.
- Highlight animation when a team's score changes.

### 🛡️ Admin Command Panel (`/admin`)
- **Team Management** — Create teams (auto-generated 6-char access codes), reset scores, full progress reset, or delete teams.
- **Checkpoint Builder** — Create checkpoints with title, sequence order, point rewards, and a volunteer letter. Mark the last one as "Final treasure checkpoint".
- **Final Treasure Settings** — Set the final password and riddle that teams must unlock after collecting all letters.
- **Printable QR Cards** — Each checkpoint generates a QR code. Hit "Print QR cards" for printer-friendly output.
- **QR Token Rotation** — Rotate a checkpoint's secret QR token instantly if compromised.
- **Live Leaderboard Tab** — View all team scores and progress in real time from the admin panel.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Backend** | Node.js, Express, Custom `server.js` |
| **Database** | MongoDB Atlas with Mongoose |
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
│   │   ├── auth/login/route.js       # Team authentication
│   │   ├── scan/route.js             # QR scan → atomic score update
│   │   ├── lifeline/route.js         # Hint lifeline with point deduction
│   │   ├── final-unlock/route.js     # Password verification for final riddle
│   │   ├── leaderboard/route.js      # GET leaderboard data
│   │   ├── progress/route.js         # GET team progress
│   │   └── admin/manage/route.js     # Full admin CRUD + settings
│   ├── login/page.jsx                # Team login screen
│   ├── dashboard/page.jsx            # Player dashboard (scanner, hint, map, final unlock)
│   ├── leaderboard/page.jsx          # Live leaderboard
│   ├── admin/page.jsx                # Admin command panel
│   ├── layout.jsx                    # Root layout with viewport config
│   ├── globals.css                   # Tailwind + dark theme + print styles
│   └── page.jsx                      # Redirects to /login
├── components/
│   ├── QRScannerModal.jsx            # Camera QR scanner (html5-qrcode)
│   ├── LifelineModal.jsx             # Points warning + hint trigger
│   ├── LeaderboardRow.jsx            # Animated leaderboard row
│   └── AdminDashboard.jsx            # Full admin interface with tabs
├── hooks/
│   └── useSocket.js                  # Socket.io React hook with cleanup
├── lib/
│   ├── dbConnect.js                  # Mongoose cached connection
│   ├── gameConfig.js                 # Game rules, serializers, password normalization
│   ├── io.js                         # Global Socket.io accessor
│   ├── progress.js                   # Progress payload builder + leaderboard emitter
│   └── models/
│       ├── Team.js                   # Team schema (score, checkpoints, lifelines, finalUnlocked)
│       ├── Checkpoint.js             # Checkpoint schema (token, reward, unlockLetter)
│       ├── GameSettings.js           # Final password + final riddle
│       └── ScanLog.js                # Audit log for scans & lifelines
├── public/
│   ├── campus-map.jpg                # Campus map image
│   └── NIELIT_Logo.png               # Logo
├── server.js                         # Express + Socket.io + Next.js unified server
├── package.json
├── .env                              # Environment variables (DO NOT COMMIT)
├── .env.example                      # Template for environment variables
├── tailwind.config.js
├── next.config.js
└── jsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/induction-treasure-hunt.git
cd induction-treasure-hunt
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root (or copy `.env.example`):

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/treasure-hunt
ADMIN_PASSKEY=your-secret-admin-key
MIN_POINTS_THRESHOLD=100
HINT_COST=10
FINAL_CLUE=The final gathering is at the Main Auditorium. Show this screen to a volunteer.
PORT=5000
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string — **must include a database name** (e.g. `/treasure-hunt`) |
| `ADMIN_PASSKEY` | Secret key to access the admin panel at `/admin` |
| `MIN_POINTS_THRESHOLD` | Minimum points required to become eligible for the final password unlock |
| `HINT_COST` | Points deducted when a team uses the Hint lifeline |
| `FINAL_CLUE` | Fallback final clue (the admin can override this via the dashboard) |
| `PORT` | Server port (default: 5000) |

### 3. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

Open **http://localhost:5000** on your phone or browser.

---

## 📱 How It Works

### Game Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  Admin sets   │────▶│  Teams scan   │────▶│  Collect letters │
│  checkpoints  │     │  QR codes in  │     │  from volunteers │
│  + password   │     │  sequence     │     │  at each stop    │
└──────────────┘     └───────────────┘     └────────┬─────────┘
                                                     │
                     ┌───────────────┐     ┌─────────▼─────────┐
                     │  Final riddle │◀────│  Enter password   │
                     │  revealed! 🎉 │     │  (formed from     │
                     │               │     │   collected letters)│
                     └───────────────┘     └───────────────────┘
```

### Setting Up (Admin)

1. Go to `/admin` and enter the `ADMIN_PASSKEY`.
2. **Create Checkpoints** — Add checkpoints with a title, sequence order, point reward, and a **letter** (one character given by the volunteer at each location). Mark the last checkpoint as "Final treasure checkpoint".
3. **Set Final Password & Riddle** — In the "Checkpoints & QR" tab, scroll to "Final treasure unlock". Enter the password (formed by the letters) and the final riddle text.
4. **Print QR Cards** — Click "Print QR cards" to print them for placement around campus.
5. **Create Teams** — Add team names. Each gets a unique 6-character access code.
6. Distribute the access codes to teams.

### Playing (Teams)

1. Open the app on your phone → `/login`.
2. Enter your team's **6-character access code**.
3. You'll see a status message — follow the volunteer's instructions.
4. At each checkpoint, **scan the QR code** using the floating 📷 button.
5. The volunteer gives you a **letter** — you'll see collected letters in your dashboard.
6. Earn points! 🎉 Watch the confetti.
7. **Stuck?** Use the Hint lifeline (−10 pts).
8. Once you have enough checkpoints and points (≥ threshold), the **"Enter the final password"** form appears.
9. Type the password (formed from collected letters) → **Final riddle unlocked!**
10. Scan the final checkpoint QR to finish the hunt.

---

## 🔒 Security & Game Integrity

### Atomic Double-Scan Prevention

The scan endpoint uses MongoDB's atomic `findOneAndUpdate` with `$ne` to guarantee a checkpoint can only be scored **once per team**, even under race conditions:

```javascript
Team.findOneAndUpdate(
  { _id: team._id, 'completedCheckpoints.checkpointId': { $ne: checkpoint._id } },
  { $inc: { score: checkpoint.pointsReward }, $push: { completedCheckpoints: { ... } } },
  { new: true }
);
```

### Sequential Checkpoint Enforcement

Teams **must scan checkpoints in order**. If they scan checkpoint #3 before #2, they get: *"Scan checkpoint 2 first."*

### Final Checkpoint Gate

The final checkpoint can only be scanned after:
- ✅ `finalTreasureUnlocked` is `true` (password entered correctly)
- ✅ Score ≥ `MIN_POINTS_THRESHOLD`

### Password Normalization

Passwords are normalized before comparison — lowercased, special characters stripped, extra whitespace collapsed — so minor formatting differences don't cause mismatches.

### Audit Trail

Every scan and lifeline usage is logged in the `ScanLog` collection with timestamps, point deltas, and metadata.

---

## 🌐 Real-Time Architecture

```
┌─────────────┐     Socket.io      ┌──────────────────┐
│  Player      │◄──────────────────►│                  │
│  Dashboard   │   leaderboard_    │   Node.js Server  │
│  /dashboard  │   update          │   (server.js)     │
├─────────────┤                    │                   │
│  Leaderboard │◄──────────────────►│  Express + Next   │
│  /leaderboard│   join_leaderboard│  + Socket.io      │
├─────────────┤                    │                   │
│  Admin Panel │◄──────────────────►│                   │
│  /admin      │   leaderboard_    └────────┬──────────┘
└─────────────┘   update                    │
                                            │ Mongoose
                                   ┌────────▼──────────┐
                                   │   MongoDB Atlas    │
                                   │   ─ teams          │
                                   │   ─ checkpoints    │
                                   │   ─ gamesettings   │
                                   │   ─ scanlogs       │
                                   └───────────────────┘
```

---

## 🖨️ Printing QR Cards

1. Navigate to `/admin` → **Checkpoints & QR** tab.
2. Click **"Print QR cards"**.
3. The print styles render QR cards in a clean 2-column grid with no UI chrome.
4. Print to PDF first, then print physical copies. Laminate for outdoor use!

---

## 🛠️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate with `accessCode` |
| `POST` | `/api/scan` | Submit scanned QR token + `accessCode` |
| `POST` | `/api/lifeline` | Use HINT lifeline |
| `POST` | `/api/final-unlock` | Submit password to unlock final riddle |
| `GET`  | `/api/progress?accessCode=...` | Get team progress, letters, next checkpoint |
| `GET`  | `/api/leaderboard` | Get sorted leaderboard |
| `POST` | `/api/admin/manage` | Admin operations (requires `x-admin-passkey` header) |

### Admin Actions (`/api/admin/manage`)

| Action | Description |
|--------|-------------|
| `login` | Validate admin passkey |
| `listTeams` | List all teams with scores and progress |
| `listCheckpoints` | List all checkpoints |
| `listLogs` | List recent scan/lifeline logs |
| `getSettings` | Get final password and riddle |
| `saveSettings` | Save/update final password and riddle |
| `createTeam` | Create team with auto-generated access code |
| `createCheckpoint` | Create checkpoint with auto-generated QR token |
| `updateCheckpoint` | Update checkpoint details |
| `resetScore` | Set a team's score to a specific value |
| `resetProgress` | Reset score, checkpoints, lifelines, and final unlock |
| `deleteTeam` | Permanently delete a team and its logs |
| `deleteCheckpoint` | Delete a checkpoint |
| `rotateToken` | Generate a new QR secret token |
| `leaderboard` | Get public leaderboard with progress % |

---

## 🗄️ Database Models

### Team
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Unique team name |
| `accessCode` | String | 6-char uppercase code (auto-generated) |
| `score` | Number | Current points |
| `finalTreasureUnlocked` | Boolean | Whether the final password was entered correctly |
| `completedCheckpoints` | Array | `[{ checkpointId, unlockLetter, unlockedAt }]` |
| `usedLifelines` | Array | `[{ lifelineType: 'HINT', cost, checkpointId, usedAt }]` |

### Checkpoint
| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Display name |
| `sequenceOrder` | Number | Order in which teams must scan (unique) |
| `qrSecretToken` | String | Secret value encoded in the QR code |
| `pointsReward` | Number | Points awarded on scan |
| `unlockLetter` | String | Single letter given by the volunteer |
| `bonusHint` | String | Hint shown when lifeline is used |

### GameSettings
| Field | Type | Description |
|-------|------|-------------|
| `key` | String | Always `"main"` |
| `finalPassword` | String | Normalized password teams must enter |
| `finalRiddle` | String | Riddle text shown after password unlock |

---

## ⚠️ Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| "Password not set by admin" | `GameSettings` collection is empty | Go to Admin → Checkpoints & QR → Save the final password and riddle |
| Database empty after URI change | MongoDB URI was missing the database name | Ensure URI ends with `/treasure-hunt` (or your db name) |
| Teams/checkpoints not showing | Wrong database | Check Atlas → Browse Collections → verify data is in the correct database |
| QR scan says "out of sequence" | Team scanned checkpoints out of order | Teams must scan in `sequenceOrder` (1, 2, 3...) |
| "Final checkpoint blocked" | Team hasn't unlocked final password yet | Enter the final password first, then scan the last QR |

---

## 📄 License

Built for the **NIELIT Induction Program**.

---

<p align="center">
  Built with ❤️ for NIELIT Induction
</p>
