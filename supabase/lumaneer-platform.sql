-- Lumaneer LMS foundation. Apply only after preview validation.
create extension if not exists pgcrypto;

create table if not exists public.lumaneer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lumaneer_courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references public.lumaneer_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lumaneer_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.lumaneer_courses(id) on delete cascade,
  slug text not null,
  title text not null,
  scripture_ref text,
  summary text,
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','scheduled','archived')),
  opens_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,slug)
);
create table if not exists public.lumaneer_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.lumaneer_courses(id) on delete cascade,
  user_id uuid not null references public.lumaneer_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','removed')),
  enrolled_at timestamptz not null default now(),
  unique(course_id,user_id)
);
create table if not exists public.lumaneer_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lumaneer_modules(id) on delete cascade,
  title text not null,
  lesson_type text not null default 'study',
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lumaneer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lumaneer_profiles(id) on delete cascade,
  module_id uuid not null references public.lumaneer_modules(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique(user_id,module_id)
);
create table if not exists public.lumaneer_discussions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lumaneer_modules(id) on delete cascade,
  title text not null,
  prompt text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create table if not exists public.lumaneer_discussion_posts (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.lumaneer_discussions(id) on delete cascade,
  user_id uuid not null references public.lumaneer_profiles(id) on delete cascade,
  body text not null,
  parent_id uuid references public.lumaneer_discussion_posts(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.lumaneer_quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lumaneer_modules(id) on delete cascade,
  title text not null,
  mode text not null default 'individual' check (mode in ('individual','team','live_review','study')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.lumaneer_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.lumaneer_quizzes(id) on delete cascade,
  position integer not null default 0,
  question text not null,
  question_type text not null default 'multiple_choice',
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  explanation text,
  practical_application text
);
create table if not exists public.lumaneer_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.lumaneer_quizzes(id) on delete cascade,
  user_id uuid not null references public.lumaneer_profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.lumaneer_live_sessions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lumaneer_modules(id) on delete cascade,
  room_key text unique not null,
  status text not null default 'ended' check (status in ('scheduled','live','ended')),
  state jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lumaneer_profiles enable row level security;
alter table public.lumaneer_courses enable row level security;
alter table public.lumaneer_modules enable row level security;
alter table public.lumaneer_enrollments enable row level security;
alter table public.lumaneer_lessons enable row level security;
alter table public.lumaneer_notes enable row level security;
alter table public.lumaneer_discussions enable row level security;
alter table public.lumaneer_discussion_posts enable row level security;
alter table public.lumaneer_quizzes enable row level security;
alter table public.lumaneer_quiz_questions enable row level security;
alter table public.lumaneer_quiz_attempts enable row level security;
alter table public.lumaneer_live_sessions enable row level security;

create or replace function public.lumaneer_is_teacher()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.lumaneer_profiles p where p.id=auth.uid() and p.role in ('teacher','admin'));
$$;

create policy "profiles read self" on public.lumaneer_profiles for select using (id=auth.uid() or public.lumaneer_is_teacher());
create policy "profiles update self" on public.lumaneer_profiles for update using (id=auth.uid()) with check (id=auth.uid());
create policy "courses enrolled read" on public.lumaneer_courses for select using (status='published' or public.lumaneer_is_teacher());
create policy "courses teacher write" on public.lumaneer_courses for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "modules published read" on public.lumaneer_modules for select using (status='published' or public.lumaneer_is_teacher());
create policy "modules teacher write" on public.lumaneer_modules for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "enrollment self read" on public.lumaneer_enrollments for select using (user_id=auth.uid() or public.lumaneer_is_teacher());
create policy "enrollment teacher write" on public.lumaneer_enrollments for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "lessons published read" on public.lumaneer_lessons for select using (exists(select 1 from public.lumaneer_modules m where m.id=module_id and (m.status='published' or public.lumaneer_is_teacher())));
create policy "lessons teacher write" on public.lumaneer_lessons for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "notes owner" on public.lumaneer_notes for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "discussions read" on public.lumaneer_discussions for select using (auth.uid() is not null);
create policy "discussions teacher write" on public.lumaneer_discussions for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "posts signed in read" on public.lumaneer_discussion_posts for select using (auth.uid() is not null);
create policy "posts create own" on public.lumaneer_discussion_posts for insert with check (user_id=auth.uid());
create policy "posts edit own" on public.lumaneer_discussion_posts for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "quizzes read" on public.lumaneer_quizzes for select using (status='published' or public.lumaneer_is_teacher());
create policy "quizzes teacher write" on public.lumaneer_quizzes for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "questions read" on public.lumaneer_quiz_questions for select using (auth.uid() is not null);
create policy "questions teacher write" on public.lumaneer_quiz_questions for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());
create policy "attempts owner" on public.lumaneer_quiz_attempts for all using (user_id=auth.uid() or public.lumaneer_is_teacher()) with check (user_id=auth.uid() or public.lumaneer_is_teacher());
create policy "live read" on public.lumaneer_live_sessions for select using (auth.uid() is not null or status='live');
create policy "live teacher write" on public.lumaneer_live_sessions for all using (public.lumaneer_is_teacher()) with check (public.lumaneer_is_teacher());

create or replace function public.handle_lumaneer_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.lumaneer_profiles(id,email,display_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)))
  on conflict(id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_lumaneer on auth.users;
create trigger on_auth_user_created_lumaneer after insert on auth.users for each row execute procedure public.handle_lumaneer_user();

insert into public.lumaneer_courses(slug,title,subtitle,description,status)
values('matthew-king-and-kingdom','Matthew: The King and His Kingdom','A chapter-by-chapter study of Matthew','The first Lumaneer course, migrating the existing Matthew teaching archive.','published')
on conflict(slug) do nothing;

insert into public.lumaneer_modules(course_id,slug,title,scripture_ref,summary,position,status)
select id,'chapter-11','The King Confronts Expectations','Matthew 11:1–30','Questioning, offense, rejection, accountability, revelation, and rest.',11,'published'
from public.lumaneer_courses where slug='matthew-king-and-kingdom'
on conflict(course_id,slug) do nothing;
