# Routes

| Path | File | Layout |
|---|---|---|
| `/` | `app/page.tsx` | redirect login/dashboard |
| `/login` | `app/(auth)/login/page.tsx` | none (centered card) |
| `/dashboard` | `app/(user)/dashboard/page.tsx` | AppShell |
| `/collection` | `app/(user)/collection/page.tsx` | AppShell |
| `/achievements` | `app/(user)/achievements/page.tsx` | AppShell |
| `/shop` | `app/(user)/shop/page.tsx` | AppShell |
| `/history` | `app/(user)/history/page.tsx` | AppShell |
| `/admin` | `app/(admin)/admin/page.tsx` | redirect `/admin/queue` |
| `/admin/queue` | `app/(admin)/admin/queue/page.tsx` | AppShell |
| `/admin/open/[id]` | `app/(admin)/admin/open/[id]/page.tsx` | AppShell |
| `/admin/users` | users list | AppShell |
| `/admin/users/[id]` | user detail | AppShell |
| `/admin/cards` | catalog CRUD | AppShell |
| `/admin/boosters` | booster types | AppShell |
| `/admin/achievements` | achievements CRUD | AppShell |
| `/admin/rewards` | shop rewards | AppShell |
| `/admin/history` | draw audit | AppShell |
| `/admin/dev` | variant + pack showcase | AppShell |
| `/reveal` | OBS overlay | reveal layout |

Auth: Twitch OAuth. `/admin/*` admin role. `/reveal` public.
