# Feature: Admin Panel (MVP)

## Summary

A lightweight admin panel accessible as a sidebar section, visible only to the admin user (`ADMIN_EMAIL`). Provides newsletter controls (send, preview, subscriber list) and a user overview with stats. Follows the existing SPA screen pattern — no new routes, no middleware, no database schema changes.

## Requirements

- **Goal:** MVP admin — newsletter controls + user overview
- **Access:** Single admin (check `ADMIN_EMAIL` env var)
- **Features:** Send newsletter button, email preview, subscriber list, user list with stats & newsletter status
- **Navigation:** Sidebar section visible only to admin
- **Safety:** Confirm dialogs before actions (e.g., "Send to N subscribers?")
- **Language:** Bilingual DE/EN via existing next-intl

## Architecture

### Auth Guard

No database changes. Admin check happens at two levels:

1. **Client-side (sidebar visibility):** Compare `userEmail` with a new `NEXT_PUBLIC_ADMIN_EMAIL` env var
2. **Server-side (API protection):** Existing `ADMIN_API_KEY` header check on admin-only endpoints

```
Sidebar → shows "ADMIN" section only if userEmail === NEXT_PUBLIC_ADMIN_EMAIL
Admin API routes → require Authorization: Bearer ADMIN_API_KEY (existing pattern)
```

### Screen Structure

```
Screen type += "admin-newsletter" | "admin-users"

Sidebar:
  COMPLIANCE
    Dashboard
    New Scan
    Scan History
  ANALYSIS
    Risk Analysis
    Recommendations
    Newsletter
  ADMIN  ← new (only visible to admin)
    Newsletter Send
    Users
  SYSTEM
    Settings
```

### New Files

| File | Purpose |
|------|---------|
| `components/admin/AdminNewsletterScreen.tsx` | Newsletter send, preview, subscriber list |
| `components/admin/AdminUsersScreen.tsx` | User list with stats |
| `app/api/admin/subscribers/route.ts` | GET: list all subscribers with details |
| `app/api/admin/users/route.ts` | GET: list all users with scan stats |
| `app/api/admin/preview-newsletter/route.ts` | POST: render newsletter HTML for preview |
| `messages/de.json` | Add `Admin.*` translation keys |
| `messages/en.json` | Add `Admin.*` translation keys |

### Modified Files

| File | Change |
|------|--------|
| `types.ts` | Add `"admin-newsletter" \| "admin-users"` to Screen type |
| `components/app-shell/Sidebar.tsx` | Add ADMIN section, conditionally shown |
| `components/ComplyRadarApp.tsx` | Render admin screens, pass `isAdmin` prop |
| `.env.local` | Add `NEXT_PUBLIC_ADMIN_EMAIL` |

## API Design

### GET /api/admin/subscribers

Returns all newsletter subscribers with their preferences.

**Auth:** `ADMIN_API_KEY` header

**Response:**
```json
{
  "subscribers": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "optedIn": true,
      "frequency": "weekly",
      "areas": ["arbeitssicherheit", "datenschutz"],
      "locale": "de",
      "updatedAt": "2026-02-17T10:00:00Z"
    }
  ],
  "total": 5,
  "optedIn": 3
}
```

### GET /api/admin/users

Returns all users with scan statistics.

**Auth:** `ADMIN_API_KEY` header

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-01-15T10:00:00Z",
      "totalScans": 4,
      "lastScanAt": "2026-02-17T08:00:00Z",
      "latestComplianceScore": 18,
      "newsletterOptedIn": true,
      "newsletterFrequency": "weekly"
    }
  ],
  "totalUsers": 12,
  "newUsersThisWeek": 3
}
```

### POST /api/admin/preview-newsletter

Renders a newsletter email for preview (does not send).

**Auth:** `ADMIN_API_KEY` header

**Request:**
```json
{
  "subscriberId": "uuid"  // optional — uses first subscriber if omitted
}
```

**Response:**
```json
{
  "html": "<html>...</html>",
  "subject": "Ihr wöchentliches Vorschriften-Update — ComplyRadar",
  "to": "user@example.com",
  "locale": "de"
}
```

### POST /api/send-newsletter (existing)

Already implemented. Admin screen calls this with the `ADMIN_API_KEY`.

## Component Design

### AdminNewsletterScreen

```
┌─────────────────────────────────────────────┐
│ 📨 Newsletter Admin                         │
│ Manage and send newsletter to subscribers   │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │    3    │ │    2    │ │    1    │       │
│ │Subscrib.│ │ Weekly  │ │Monthly │       │
│ └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│ [ Preview Email ]  [ Send Newsletter Now ]  │
│                                             │
│ ─── Subscribers ────────────────────────── │
│                                             │
│ user@example.com    Weekly  DE  Opted In    │
│ other@test.com      Monthly EN  Opted In    │
│ old@user.com        Weekly  DE  Opted Out   │
│                                             │
│ ─── Preview ─────────────────────────────── │
│ (rendered email HTML in iframe/container)   │
└─────────────────────────────────────────────┘
```

**Send flow:**
1. User clicks "Send Newsletter Now"
2. Confirmation dialog: "Send newsletter to N active subscribers?"
3. On confirm → calls `/api/send-newsletter`
4. Shows results: "Sent: 3, Failed: 0"

### AdminUsersScreen

```
┌─────────────────────────────────────────────┐
│ 👥 Users                                    │
│ All registered users                         │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────┐ ┌──────────┐                   │
│ │   12    │ │    3     │                   │
│ │ Total   │ │ New/Week │                   │
│ └─────────┘ └──────────┘                   │
│                                             │
│ ─── User List ──────────────────────────── │
│                                             │
│ Email           Scans  Score  Newsletter    │
│ user@ex.com       4    18%   Weekly DE ✓   │
│ other@test.com    1    45%   Monthly EN ✓  │
│ new@user.com      0     —    Not subscribed │
│                                             │
│ Signed up: Jan 15, 2026                     │
│ Last scan: Feb 17, 2026                     │
└─────────────────────────────────────────────┘
```

## Sending the ADMIN_API_KEY from Client

The admin screen needs to call admin-only API endpoints. Since the key cannot be exposed to the client, we use a **proxy pattern**:

- Create admin API routes that check the Supabase session server-side
- Verify the session user's email matches `ADMIN_EMAIL` env var
- No API key needed from the client — the server checks both session + admin email

```typescript
// Admin API route pattern
const supabase = await createSupabaseServerClient();
const { userId, error } = await requireAuth(supabase);
if (!userId) return NextResponse.json({ error }, { status: 401 });

const { data: { user } } = await supabase.auth.getUser();
if (user?.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Admin-authorized — use service role for cross-user queries
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

This is more secure than passing an API key from the browser.

## i18n Keys

```json
{
  "Admin": {
    "newsletter": "Newsletter Admin",
    "newsletterDesc": "Manage and send newsletter to subscribers",
    "users": "Users",
    "usersDesc": "All registered users",
    "subscribers": "Subscribers",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "optedIn": "Opted In",
    "optedOut": "Opted Out",
    "sendNow": "Send Newsletter Now",
    "preview": "Preview Email",
    "confirmSend": "Send newsletter to {count} active subscribers?",
    "sending": "Sending...",
    "sendSuccess": "Sent: {sent}, Failed: {failed}",
    "sendError": "Failed to send newsletter",
    "totalUsers": "Total Users",
    "newThisWeek": "New This Week",
    "scans": "Scans",
    "score": "Score",
    "lastScan": "Last Scan",
    "signedUp": "Signed Up",
    "noScans": "No scans yet",
    "notSubscribed": "Not subscribed",
    "cancel": "Cancel",
    "confirm": "Confirm"
  }
}
```

## Implementation Tasks

- [ ] **Add Screen types** `priority:1` `phase:types`
  - files: `types.ts`
  - Add `"admin-newsletter" | "admin-users"` to Screen type

- [ ] **Add NEXT_PUBLIC_ADMIN_EMAIL env var** `priority:1` `phase:config`
  - files: `.env.local`
  - Add `NEXT_PUBLIC_ADMIN_EMAIL=vilin.1927@gmail.com`

- [ ] **Add i18n keys** `priority:2` `phase:i18n`
  - files: `messages/de.json`, `messages/en.json`
  - Add `Admin.*` namespace with all keys

- [ ] **Create admin API routes** `priority:2` `phase:api`
  - files: `app/api/admin/subscribers/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/preview-newsletter/route.ts`
  - Session-based admin auth (no API key from client)
  - Service role Supabase client for cross-user queries

- [ ] **Create AdminNewsletterScreen** `priority:3` `phase:ui` `deps:api,i18n`
  - files: `components/admin/AdminNewsletterScreen.tsx`
  - Stat cards, subscriber table, preview panel, send button with confirmation

- [ ] **Create AdminUsersScreen** `priority:3` `phase:ui` `deps:api,i18n`
  - files: `components/admin/AdminUsersScreen.tsx`
  - Stat cards, user table with stats

- [ ] **Update Sidebar** `priority:4` `phase:ui` `deps:types`
  - files: `components/app-shell/Sidebar.tsx`
  - Add ADMIN section, conditionally visible when `userEmail === NEXT_PUBLIC_ADMIN_EMAIL`

- [ ] **Wire up in ComplyRadarApp** `priority:4` `phase:ui` `deps:screens,sidebar`
  - files: `components/ComplyRadarApp.tsx`
  - Render admin screens, pass isAdmin prop to sidebar

- [ ] **Add to Vercel** `priority:5` `phase:deploy`
  - Add `NEXT_PUBLIC_ADMIN_EMAIL` env var on Vercel

## Security Considerations

- Admin email check is **client-side for UI only** (sidebar visibility) — not a security boundary
- All admin API routes verify session + admin email **server-side** — this IS the security boundary
- Service role key is **never exposed to the client**
- No destructive actions in v1 (read-only + newsletter send)
- Confirm dialogs prevent accidental sends
