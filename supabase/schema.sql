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

create table if not exists public.action_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action_type text not null,
  created_at timestamptz not null default timezone('utc', now())
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
create index if not exists action_rate_limits_user_action_idx on public.action_rate_limits (user_id, action_type, created_at desc);

create or replace function public.enforce_action_rate_limit(
  action_user_id uuid,
  action_key text,
  max_actions integer,
  window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  window_start timestamptz;
  actions_count integer;
  normalized_action_key text;
begin
  if auth.uid() is null or action_user_id is null or auth.uid() <> action_user_id then
    raise exception 'Acción no permitida para esta cuenta.' using errcode = '42501';
  end if;

  normalized_action_key := btrim(coalesce(action_key, ''));

  if length(normalized_action_key) = 0 then
    raise exception 'Acción inválida.' using errcode = '22023';
  end if;

  window_start := timezone('utc', now()) - make_interval(secs => greatest(window_seconds, 1));

  delete from public.action_rate_limits
  where created_at < timezone('utc', now()) - interval '1 day';

  select count(*)
  into actions_count
  from public.action_rate_limits as arl
  where arl.user_id = action_user_id
    and arl.action_type = normalized_action_key
    and arl.created_at >= window_start;

  if actions_count >= max_actions then
    raise exception 'Demasiadas acciones seguidas. Esperá un momento y volvé a intentar.' using errcode = 'P0001';
  end if;

  insert into public.action_rate_limits (user_id, action_type)
  values (action_user_id, normalized_action_key);
end;
$$;

create or replace function public.validate_profile_input()
returns trigger
language plpgsql
as $$
begin
  new.handle := lower(regexp_replace(btrim(coalesce(new.handle, '')), '^@+', ''));
  new.display_name := left(btrim(coalesce(new.display_name, '')), 60);
  new.bio := left(btrim(coalesce(new.bio, '')), 180);
  new.avatar_url := left(btrim(coalesce(new.avatar_url, '')), 600);
  new.wallpaper_url := left(btrim(coalesce(new.wallpaper_url, '')), 600);
  new.avatar_moderation_status := left(btrim(coalesce(new.avatar_moderation_status, 'approved')), 40);
  new.wallpaper_moderation_status := left(btrim(coalesce(new.wallpaper_moderation_status, 'approved')), 40);
  new.theme_preset := left(btrim(coalesce(new.theme_preset, 'vinyl-night')), 40);

  if new.handle !~ '^[a-z0-9_\.]{3,24}$' then
    raise exception 'Elegí un @ de 3 a 24 caracteres con letras, números, punto o guion bajo.' using errcode = '22023';
  end if;

  if length(new.display_name) = 0 then
    new.display_name := new.handle;
  end if;

  return new;
end;
$$;

create or replace function public.validate_review_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.user_id, 'review:create', 8, 60);
  new.album_id := left(btrim(coalesce(new.album_id, '')), 160);
  new.album_title := left(btrim(coalesce(new.album_title, '')), 160);
  new.album_artist := left(btrim(coalesce(new.album_artist, '')), 160);
  new.cover_url := left(btrim(coalesce(new.cover_url, '')), 600);
  new.body := btrim(coalesce(new.body, ''));

  if length(new.album_id) = 0 or length(new.album_title) = 0 then
    raise exception 'Faltan datos del disco para publicar la reseña.' using errcode = '22023';
  end if;

  if length(new.body) > 1200 then
    raise exception 'La reseña es demasiado larga.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.validate_review_comment_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.user_id, 'review:comment', 12, 60);
  new.body := btrim(coalesce(new.body, ''));

  if length(new.body) = 0 then
    raise exception 'El comentario no puede estar vacío.' using errcode = '22023';
  end if;

  if length(new.body) > 500 then
    raise exception 'El comentario es demasiado largo.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.validate_review_like_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.user_id, 'review:like', 45, 60);
  return new;
end;
$$;

create or replace function public.validate_follow_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.follower_id, 'profile:follow', 25, 60);
  return new;
end;
$$;

create or replace function public.validate_message_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.sender_id, 'message:send', 30, 60);
  new.body := btrim(coalesce(new.body, ''));
  new.album_id := nullif(left(btrim(coalesce(new.album_id, '')), 160), '');
  new.album_title := left(btrim(coalesce(new.album_title, '')), 160);
  new.album_artist := left(btrim(coalesce(new.album_artist, '')), 160);
  new.album_cover := left(btrim(coalesce(new.album_cover, '')), 600);

  if length(new.body) = 0 and new.album_id is null then
    raise exception 'El mensaje no puede estar vacío.' using errcode = '22023';
  end if;

  if length(new.body) > 600 then
    raise exception 'El mensaje es demasiado largo.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.validate_report_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.reporter_id, 'report:create', 8, 60);
  new.target_type := left(btrim(coalesce(new.target_type, '')), 40);
  new.target_id := left(btrim(coalesce(new.target_id, '')), 160);
  new.reason := left(btrim(coalesce(new.reason, '')), 80);
  new.details := left(btrim(coalesce(new.details, '')), 500);

  if length(new.target_type) = 0 or length(new.target_id) = 0 or length(new.reason) = 0 then
    raise exception 'Faltan datos para enviar el reporte.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.validate_listening_event_input()
returns trigger
language plpgsql
as $$
begin
  perform public.enforce_action_rate_limit(new.user_id, 'listening:create', 90, 60);
  new.album_id := left(btrim(coalesce(new.album_id, '')), 160);
  new.album_title := left(btrim(coalesce(new.album_title, '')), 160);
  new.album_artist := left(btrim(coalesce(new.album_artist, '')), 160);
  new.cover_url := left(btrim(coalesce(new.cover_url, '')), 600);
  new.preview_url := left(btrim(coalesce(new.preview_url, '')), 600);
  new.source := left(btrim(coalesce(new.source, 'player')), 40);

  if length(new.album_id) = 0 or length(new.album_title) = 0 then
    raise exception 'Faltan datos para guardar la escucha.' using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_handle text;
  safe_handle text;
  safe_display_name text;
begin
  raw_handle := coalesce(new.raw_user_meta_data ->> 'handle', split_part(coalesce(new.email, ''), '@', 1), '');
  raw_handle := regexp_replace(btrim(raw_handle), '^@+', '');
  safe_handle := regexp_replace(lower(raw_handle), '[^a-z0-9_.]', '_', 'g');
  safe_handle := regexp_replace(safe_handle, '(^[._]+|[._]+$)', '', 'g');
  safe_handle := regexp_replace(safe_handle, '[._]{2,}', '_', 'g');

  if length(safe_handle) < 3 then
    safe_handle := 'user_' || replace(left(new.id::text, 8), '-', '');
  end if;

  safe_handle := left(safe_handle, 24);
  safe_display_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), 'B-Sider')), 60);

  if length(safe_display_name) = 0 then
    safe_display_name := safe_handle;
  end if;

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
    safe_handle,
    safe_display_name,
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
alter table public.action_rate_limits enable row level security;

drop trigger if exists profiles_validate_input on public.profiles;
create trigger profiles_validate_input
before insert or update on public.profiles
for each row execute function public.validate_profile_input();

drop trigger if exists reviews_validate_input on public.reviews;
create trigger reviews_validate_input
before insert on public.reviews
for each row execute function public.validate_review_input();

drop trigger if exists review_comments_validate_input on public.review_comments;
create trigger review_comments_validate_input
before insert on public.review_comments
for each row execute function public.validate_review_comment_input();

drop trigger if exists review_likes_validate_input on public.review_likes;
create trigger review_likes_validate_input
before insert on public.review_likes
for each row execute function public.validate_review_like_input();

drop trigger if exists follows_validate_input on public.follows;
create trigger follows_validate_input
before insert on public.follows
for each row execute function public.validate_follow_input();

drop trigger if exists messages_validate_input on public.messages;
create trigger messages_validate_input
before insert on public.messages
for each row execute function public.validate_message_input();

drop trigger if exists reports_validate_input on public.reports;
create trigger reports_validate_input
before insert on public.reports
for each row execute function public.validate_report_input();

drop trigger if exists listening_events_validate_input on public.listening_events;
create trigger listening_events_validate_input
before insert on public.listening_events
for each row execute function public.validate_listening_event_input();

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
