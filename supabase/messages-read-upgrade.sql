alter table public.messages
  add column if not exists read_at timestamptz;

create index if not exists messages_receiver_read_idx
  on public.messages (receiver_id, read_at, created_at desc);

drop policy if exists "Users mark received messages as read" on public.messages;
create policy "Users mark received messages as read"
on public.messages
for update
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);
