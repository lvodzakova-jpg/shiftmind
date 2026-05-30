-- ShiftMind — spustite v Supabase SQL Editori

create extension if not exists "pgcrypto";

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null default 'barista',
  max_hours_per_week numeric(4, 1) not null check (
    max_hours_per_week >= 1 and max_hours_per_week <= 60
    and mod(max_hours_per_week * 2, 1) = 0
  ),
  created_at timestamptz not null default now()
);

create table if not exists preferences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references employees(id) on delete cascade,
  monday text not null default 'off' check (
    monday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  tuesday text not null default 'off' check (
    tuesday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  wednesday text not null default 'off' check (
    wednesday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  thursday text not null default 'off' check (
    thursday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  friday text not null default 'off' check (
    friday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  saturday text not null default 'off' check (
    saturday in ('morning', 'evening', 'full', 'off', 'unavailable')
  ),
  sunday text not null default 'off' check (
    sunday in ('morning', 'evening', 'full', 'off', 'unavailable')
  )
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  shift_type text not null check (
    shift_type in ('morning', 'evening', 'full', 'off', 'sick')
  ),
  start_time time not null,
  end_time time not null,
  unique (employee_id, date)
);

create index if not exists idx_shifts_date on shifts(date);
create index if not exists idx_preferences_employee on preferences(employee_id);

alter table employees enable row level security;
alter table preferences enable row level security;
alter table shifts enable row level security;

drop policy if exists "employees_all" on employees;
create policy "employees_all" on employees for all using (true) with check (true);

drop policy if exists "preferences_all" on preferences;
create policy "preferences_all" on preferences for all using (true) with check (true);

drop policy if exists "shifts_all" on shifts;
create policy "shifts_all" on shifts for all using (true) with check (true);

create table if not exists branch_settings (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null default 'Kaviareň Centrum',
  min_staff_per_shift int not null default 2 check (min_staff_per_shift >= 1),
  monday_open time not null default '07:00',
  monday_close time not null default '22:00',
  tuesday_open time not null default '07:00',
  tuesday_close time not null default '22:00',
  wednesday_open time not null default '07:00',
  wednesday_close time not null default '22:00',
  thursday_open time not null default '07:00',
  thursday_close time not null default '22:00',
  friday_open time not null default '07:00',
  friday_close time not null default '22:00',
  saturday_open time not null default '08:00',
  saturday_close time not null default '20:00',
  sunday_open time not null default '08:00',
  sunday_close time not null default '20:00',
  updated_at timestamptz not null default now()
);

create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  actual_hours numeric(6, 2),
  overtime_hours numeric(6, 2)
);

create index if not exists idx_time_logs_employee on time_logs(employee_id);
create index if not exists idx_time_logs_shift on time_logs(shift_id);

alter table branch_settings enable row level security;
alter table time_logs enable row level security;

drop policy if exists "branch_settings_all" on branch_settings;
create policy "branch_settings_all" on branch_settings for all using (true) with check (true);

drop policy if exists "time_logs_all" on time_logs;
create policy "time_logs_all" on time_logs for all using (true) with check (true);

insert into branch_settings (branch_name, min_staff_per_shift)
select 'Kaviareň Centrum', 2
where not exists (select 1 from branch_settings limit 1);

-- Ukážkoví zamestnanci
insert into employees (name, email, role, max_hours_per_week)
select * from (values
  ('Mária Nováková', 'maria@kaviaren.sk', 'manager', 40),
  ('Peter Kováč', 'peter@kaviaren.sk', 'barista', 35.5),
  ('Eva Horváthová', 'eva@kaviaren.sk', 'senior_barista', 40),
  ('Ján Šimko', 'jan@kaviaren.sk', 'waiter', 20)
) as v(name, email, role, max_hours_per_week)
where not exists (select 1 from employees limit 1);
