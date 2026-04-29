create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  display_name text not null default '',
  birth_date date,
  profile_completed_at timestamptz,
  bio text not null default '',
  avatar_url text not null default '',
  avatar_moderation_status text not null default 'approved',
  wallpaper_url text not null default '',
  wallpaper_moderation_status text not null default 'approved',
  theme_preset text not null default 'vinyl-night',
  plan text not null default 'free',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists avatar_moderation_status text not null default 'approved';

alter table public.profiles
  add column if not exists wallpaper_moderation_status text not null default 'approved';

alter table public.profiles
  add column if not exists birth_date date;

alter table public.profiles
  add column if not exists profile_completed_at timestamptz;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id text not null,
  album_title text not null,
  album_artist text not null default '',
  cover_url text not null default '',
  rating integer not null check (rating between 0 and 5),
  body text not null default '',
  scratched_review_id uuid references public.reviews (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_likes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (review_id, user_id)
);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null default '#A855F7',
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  album_id text not null,
  album_title text not null,
  album_artist text not null default '',
  cover_url text not null default '',
  position integer not null default 0,
  added_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  album_id text,
  album_title text,
  album_artist text,
  album_cover text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.messages
  add column if not exists read_at timestamptz;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  provider_customer_id text,
  renews_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.listening_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id text not null,
  album_title text not null,
  album_artist text not null default '',
  cover_url text not null default '',
  preview_url text not null default '',
  source text not null default 'player',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  entity_type text not null default 'social',
  entity_id text,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null default 'android',
  project_id text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists review_comments_review_id_idx on public.review_comments (review_id);
create index if not exists lists_user_id_idx on public.lists (user_id);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists messages_receiver_read_idx on public.messages (receiver_id, read_at, created_at desc);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists listening_events_user_id_idx on public.listening_events (user_id, created_at desc);
create index if not exists notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);
create index if not exists push_devices_user_id_idx on public.push_devices (user_id, is_active, last_seen_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    handle,
    display_name,
    birth_date,
    profile_completed_at,
    bio,
    avatar_url,
    avatar_moderation_status,
    wallpaper_url,
    wallpaper_moderation_status,
    theme_preset,
    plan
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    null,
    '',
    '',
    'approved',
    '',
    'approved',
    'vinyl-night',
    'free'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.listening_events enable row level security;
alter table public.notifications enable row level security;
alter table public.push_devices enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles
for select
using (true);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Reviews are readable" on public.reviews;
create policy "Reviews are readable"
on public.reviews
for select
using (true);

drop policy if exists "Users manage own reviews" on public.reviews;
create policy "Users manage own reviews"
on public.reviews
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Review likes are readable" on public.review_likes;
create policy "Review likes are readable"
on public.review_likes
for select
using (true);

drop policy if exists "Users manage own likes" on public.review_likes;
create policy "Users manage own likes"
on public.review_likes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Review comments are readable" on public.review_comments;
create policy "Review comments are readable"
on public.review_comments
for select
using (true);

drop policy if exists "Users manage own comments" on public.review_comments;
create policy "Users manage own comments"
on public.review_comments
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Lists are readable when public or owner" on public.lists;
create policy "Lists are readable when public or owner"
on public.lists
for select
using (is_public or auth.uid() = user_id);

drop policy if exists "Users manage own lists" on public.lists;
create policy "Users manage own lists"
on public.lists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "List items readable with list access" on public.list_items;
create policy "List items readable with list access"
on public.list_items
for select
using (
  exists (
    select 1
    from public.lists
    where public.lists.id = list_id
      and (public.lists.is_public or public.lists.user_id = auth.uid())
  )
);

drop policy if exists "Users manage items in own lists" on public.list_items;
create policy "Users manage items in own lists"
on public.list_items
for all
using (
  exists (
    select 1
    from public.lists
    where public.lists.id = list_id
      and public.lists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lists
    where public.lists.id = list_id
      and public.lists.user_id = auth.uid()
  )
);

drop policy if exists "Users read follows" on public.follows;
create policy "Users read follows"
on public.follows
for select
using (true);

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows"
on public.follows
for all
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

drop policy if exists "Users read own blocks" on public.blocks;
create policy "Users read own blocks"
on public.blocks
for select
using (auth.uid() = blocker_id);

drop policy if exists "Users manage own blocks" on public.blocks;
create policy "Users manage own blocks"
on public.blocks
for all
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
on public.messages
for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users send own messages" on public.messages;
create policy "Users send own messages"
on public.messages
for insert
with check (auth.uid() = sender_id);

drop policy if exists "Users mark received messages as read" on public.messages;
create policy "Users mark received messages as read"
on public.messages
for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
on public.reports
for select
using (auth.uid() = reporter_id);

drop policy if exists "Users create own reports" on public.reports;
create policy "Users create own reports"
on public.reports
for insert
with check (auth.uid() = reporter_id);

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users read own listening events" on public.listening_events;
create policy "Users read own listening events"
on public.listening_events
for select
using (auth.uid() = user_id);

drop policy if exists "Users insert own listening events" on public.listening_events;
create policy "Users insert own listening events"
on public.listening_events
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
on public.notifications
for select
using (auth.uid() = recipient_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
on public.notifications
for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

drop policy if exists "Users create notifications as actor" on public.notifications;
-- Notification inserts are intentionally restricted to trusted Edge Functions.
-- Clients can read/update their own notifications, but creation goes through
-- notify-create so event type, actor and rate limits stay enforceable.

drop policy if exists "Users read own push devices" on public.push_devices;
create policy "Users read own push devices"
on public.push_devices
for select
using (auth.uid() = user_id);

drop policy if exists "Users manage own push devices" on public.push_devices;
create policy "Users manage own push devices"
on public.push_devices
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 10485760, array['image/*']),
  ('wallpapers', 'wallpapers', true, 10485760, array['image/*'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Avatar insert own folder" on storage.objects;
create policy "Avatar insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Avatar update own folder" on storage.objects;
create policy "Avatar update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Avatar delete own folder" on storage.objects;
create policy "Avatar delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Wallpaper public read" on storage.objects;
create policy "Wallpaper public read"
on storage.objects
for select
to public
using (bucket_id = 'wallpapers');

drop policy if exists "Wallpaper insert own folder" on storage.objects;
create policy "Wallpaper insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wallpapers'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Wallpaper update own folder" on storage.objects;
create policy "Wallpaper update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wallpapers'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
)
with check (
  bucket_id = 'wallpapers'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Wallpaper delete own folder" on storage.objects;
create policy "Wallpaper delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wallpapers'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
