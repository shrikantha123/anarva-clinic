create table if not exists public.patient_assessments (
  patient_id text primary key,
  name text not null,
  phone text not null default '',
  gender text not null default '',
  address text not null default '',
  quiz_answers jsonb not null,
  photo_urls jsonb not null,
  analysis jsonb not null,
  status text not null check (status in ('Pending Review', 'Reviewed', 'Contacted', 'Treatment Started', 'Completed')),
  created_at timestamptz not null
);

create table if not exists public.appointments (
  id text primary key,
  appointment_id text not null unique,
  patient_name text not null,
  patient_phone text not null default '',
  specialist text not null,
  date date not null,
  time_slot text not null,
  type text not null,
  notes text not null default '',
  status text not null check (status in ('Confirmed', 'Pending', 'Completed', 'Cancelled')),
  created_at timestamptz not null
);

create index if not exists patient_assessments_created_at_idx
  on public.patient_assessments (created_at desc);
create index if not exists appointments_created_at_idx
  on public.appointments (created_at desc);

alter table public.patient_assessments enable row level security;
alter table public.appointments enable row level security;

revoke all on table public.patient_assessments from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
grant all on table public.patient_assessments to service_role;
grant all on table public.appointments to service_role;
