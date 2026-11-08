-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "own profile select"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "own profile insert"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "own profile update"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- NEW USER PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
      ),
      80
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- LEARNING PATHS
create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  level text,
  student jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, subject, topic)
);

grant select, insert, update, delete
on public.learning_paths to authenticated;

grant all on public.learning_paths to service_role;

alter table public.learning_paths enable row level security;

create policy "own paths"
on public.learning_paths for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ASSESSMENTS
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  concept text not null,
  question text not null,
  answer text not null,
  score int,
  status text not null,
  correct boolean,
  feedback text not null,
  strengths jsonb not null default '[]'::jsonb,
  missing_points jsonb not null default '[]'::jsonb,
  misconceptions jsonb not null default '[]'::jsonb,
  recommended_next_step text,
  evaluation_method text not null,
  created_at timestamptz not null default now()
);

create index assessments_user_idx
on public.assessments (user_id, subject, topic, created_at desc);

grant select, insert, delete
on public.assessments to authenticated;

grant all on public.assessments to service_role;

alter table public.assessments enable row level security;

create policy "own assessments select"
on public.assessments for select to authenticated
using (auth.uid() = user_id);

create policy "own assessments insert"
on public.assessments for insert to authenticated
with check (auth.uid() = user_id);

create policy "own assessments delete"
on public.assessments for delete to authenticated
using (auth.uid() = user_id);