# BothFree — runnable frontend prototype

This is an English-language Next.js starter, **not a production-ready site**.

## Start
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Included
- Four entry points: Jury Access, Explore as User, Log In, Sign Up.
- Working isolated client-side demo navigation.
- 50 clearly fictional profiles and demo friend requests.
- Travel planning form with dates, flexible periods, destination, budgets, cost-sharing, comfort, visibility, and notes.
- Local-only illustrative chat.
- Optional respectful inclusivity question.

## Not yet implemented (do not claim otherwise)
- Real login, signup, OTP emails, user persistence, role security.
- Database, RLS, real friendship acceptance, realtime chat, matching, notifications, billing.
- Production moderation, safety checks, and data retention jobs.

## Deployment
GitHub is for storing code. GitHub Pages cannot run this Next.js server/API stack. Deploy via Railway (as in the original spec) or a Next.js-compatible host, using its generated subdomain. Supabase provides database and Auth. Configure email SMTP sender/domain before relying on OTP delivery.

## Data retention
Expire past public activities and requests using a scheduled server-side job; retain confirmed plans, conversations, moderation records, and legally required records under explicit separate policies. Never silently erase user messages.

## Next steps
Connect Supabase Auth and PostgreSQL, add RLS policies, private friend requests, secure chat, server-side matching and scheduled cleanup. Do not place secrets in GitHub.
