create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  display_name text not null default '',
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

create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists review_comments_review_id_idx on public.review_comments (review_id);
create index if not exists lists_user_id_idx on public.lists (user_id);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

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

create policy "Profiles are readable"
on public.profiles
for select
using (true);

create policy "Users manage own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Reviews are readable"
on public.reviews
for select
using (true);

create policy "Users manage own reviews"
on public.reviews
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Review likes are readable"
on public.review_likes
for select
using (true);

create policy "Users manage own likes"
on public.review_likes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Review comments are readable"
on public.review_comments
for select
using (true);

create policy "Users manage own comments"
on public.review_comments
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Lists are readable when public or owner"
on public.lists
for select
using (is_public or auth.uid() = user_id);

create policy "Users manage own lists"
on public.lists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

create policy "Users read follows"
on public.follows
for select
using (true);

create policy "Users manage own follows"
on public.follows
for all
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

create policy "Users read own blocks"
on public.blocks
for select
using (auth.uid() = blocker_id);

create policy "Users manage own blocks"
on public.blocks
for all
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id);

create policy "Users read own messages"
on public.messages
for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users send own messages"
on public.messages
for insert
with check (auth.uid() = sender_id);

create policy "Users read own reports"
on public.reports
for select
using (auth.uid() = reporter_id);

create policy "Users create own reports"
on public.reports
for insert
with check (auth.uid() = reporter_id);

create policy "Users read own subscription"
on public.subscriptions
for select
using (auth.uid() = user_id);
