Here's the full picture 📋

## ✅ SOLVED — 5 fixes, all verified with proof

| # | Fix | Proof it works |
|---|-----|----------------|
| 1 | **Settings loading** — app read its config file too late before anything ran | Real Cloudinary URLs now come back from uploads |
| 2 | **Photo upload blocker** — removed the paid-plan feature (`aws_rek`) that was rejecting every upload | Test upload → `res.cloudinary.com/...` ✅ |
| 3 | **Freeze attack** — one crafted request could lock up the whole server forever | multer upgraded 1.4.5 → 2.4.0, audit warnings down |
| 4 | **Block lookup speed** — "who blocked me" used to read the entire blocks table | New index confirmed **live in the database** |
| 5 | **Login code scrambling** — 6-digit codes sat readable in the DB | DB row now shows only a fingerprint; mixed-case login test passed |

## 🔄 IN FLIGHT — patches written, not yet applied

| # | Fix | Waiting on |
|---|-----|-----------|
| **#5** | **Admin notes leak** — private staff notes sent to every user's browser | Your AI's lone-`+` projection test (report.js) |
| **#6** | **Environment posture** — server refuses to boot without a valid `NODE_ENV` | Apply + the 3 side steps (`.env`, `.env.test`, Render) |
| **#7** | **Rate-limit drift** — honest limit (500/5min), body size 10MB → 1MB | Apply + the 2 quick verify tests |

