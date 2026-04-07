# Supabase migrations (Tax CRM)

Apply migrations in order from the Supabase SQL editor or CLI:

```bash
supabase db push
# or paste SQL into Dashboard → SQL Editor
```

## Environment (frontend)

In `v0-tax-crm-frontend/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (anon key)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required to create employee users from Admin UI)
- `NEXT_PUBLIC_APP_URL` (optional; used for invitation links, e.g. `http://localhost:3000`)

## Auth notes

- **Email confirmation**: For local dev, disable “Confirm email” in Supabase Auth settings so clients can sign up and immediately call `consume_invitation`.
- **Admin / employee users**: Create users in Supabase Auth, then set roles:

```sql
update public.profiles set role = 'admin' where email = 'you@firm.com';
update public.profiles set role = 'employee' where email = 'prep@firm.com';
```

New self-signups get `client` via the `handle_new_user` trigger.

## Storage

Bucket `tax-documents` is created by migration. Paths are `{ticket_id}/{filename}`.
