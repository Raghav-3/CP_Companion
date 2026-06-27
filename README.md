# ⚡ CP Companion — Competitive Programming Hub

A complete competitive programming dashboard built with pure HTML, CSS, and JavaScript.

## Features

| Feature | Description |
|---|---|
| 🏠 Dashboard | Overview with clock, stats, next contest countdown, goals & daily challenge |
| 🏆 Contests | Live countdowns for Codeforces, LeetCode, AtCoder, CodeChef. Filter by platform |
| 👤 Codeforces | Fetch real profile data — rating, rank, max rating, contribution + rating history chart |
| 🧩 LeetCode | Fetch real stats — Easy/Medium/Hard solved, contest rating, global rank |
| 📋 Daily Planner | Task manager with categories, progress bar, LocalStorage persistence |
| ⭐ Bookmarks | Star contests for quick access. Countdown timers included |
| 📝 Notes | Per-contest or general notes. Auto-save. Full editor |
| 🎯 Daily Challenge | Random problem from curated 20-problem bank. Filter by difficulty |
| 🌙 Dark/Light Mode | Toggle anytime — preference saved |
| 📱 Responsive | Works on mobile, tablet, and desktop |

## APIs Used

- **Codeforces API** — `https://codeforces.com/api/user.info` + `user.rating`
- **LeetCode** — Community stats API
- **Contests** — Realistically seeded mock data (easily swappable with clist.by API)

## How to Run

Just open `index.html` in any modern browser. No build step, no npm install.

```bash
# Option 1: Direct open
open index.html

# Option 2: Local server (avoids CORS on some browsers)
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — CSS Variables, Grid, Flexbox, Animations
- **Vanilla JavaScript** — All features, no frameworks
- **Chart.js** — Rating history chart (CDN)
- **Google Fonts** — Inter + JetBrains Mono

## Design

- Dark terminal aesthetic with electric violet + neon cyan palette
- Glass-morphism cards with gradient accents  
- JetBrains Mono for all data/numbers (developer feel)
- Smooth transitions and hover micro-interactions
