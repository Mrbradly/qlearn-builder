# MSHS IT Help Desk - Device Loans & IT Support

Node + Express + EJS prototype matching the supplied UI mockups.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Login system

This version includes a working session-based login system.

Configured roles:

- Bradly Saunders: Account Owner, full access.
- Frank Axthammer: IT Staff, operational UI access.
- Christian Bracco: IT Staff, operational UI access.

Passwords are not stored in plain text in the project. The local demo uses Node's built-in `crypto.scrypt` password hashing.

## Role rules

The app uses this access model:

```text
Account Owner -> Full UI access, parent application approval, laptop assignment queue.
IT Staff      -> Operational UI access for devices, loans, issues and damage reports.
Parents       -> Public short-term laptop loan form only, no login.
```

Only the Account Owner can access:

```text
/parent-applications
```

When a parent application is approved, the mock flow moves the student into the `Students Needing a Laptop` queue on the Parent Applications page and Loan Manager page.

## Main routes

```text
/login
/dashboard
/devices
/devices/MSHS-LAP-0001
/loans
/apply/short-term-laptop-loan
/issues
/damage-reports
/parent-applications
/warranty-alerts
/students
/reports
```

## Database

The Supabase/Postgres schema is in:

```text
database/schema.sql
```

Current UI data is mocked in:

```text
data/mockData.js
```

When ready, replace the mock handlers with Supabase queries in the controllers and API routes. Keep the `SUPABASE_SERVICE_ROLE_KEY` on the server only. Never expose it in browser JavaScript.

## Security notes before deployment

- Replace `SESSION_SECRET` with a long random value.
- Use HTTPS in production.
- Move from the local demo users to Supabase Auth or another managed identity system.
- Keep parent application approval restricted to the Account Owner role.
- Use soft delete/archive rather than permanent delete for device, loan, issue and damage records.
