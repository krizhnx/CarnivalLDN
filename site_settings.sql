-- Site-wide settings (seasonal theme toggle, etc.)
-- OPTIONAL. By default the Halloween theme is controlled in code (src/theme/config.ts).
-- To flip it from the admin dashboard instead: run this once in the Supabase SQL editor,
-- then set ADMIN_THEME_SWITCH = true in src/theme/config.ts and redeploy.

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values ('theme', 'default')
on conflict (key) do nothing;

alter table public.site_settings enable row level security;

-- Everyone (the public site) can read settings
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

-- NOTE: the admin dashboard talks to Supabase with the public anon key (admin login is
-- client-side only), so updates must be allowed for anon. This policy limits that to
-- switching the theme between known values. Replace with an authenticated-only policy
-- once admin auth moves to Supabase Auth.
drop policy if exists "site_settings_theme_update" on public.site_settings;
create policy "site_settings_theme_update" on public.site_settings
  for update using (key = 'theme')
  with check (key = 'theme' and value in ('default', 'halloween'));

-- Push changes to open browsers in real time
do $$
begin
  alter publication supabase_realtime add table public.site_settings;
exception
  when duplicate_object then null;
end $$;
