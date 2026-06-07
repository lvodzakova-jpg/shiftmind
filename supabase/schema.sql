-- ShiftMind — spustite v Supabase SQL Editori

create extension if not exists "pgcrypto";

-- Shared team workspace (linked to Supabase Auth users).
create table if not exists workspaces (
  id uuid primary key,
  name text not null default 'My business',
  invite_code text unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;
drop policy if exists "workspaces_all" on workspaces;
create policy "workspaces_all" on workspaces for all using (true) with check (true);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);

alter table workspace_members enable row level security;
drop policy if exists "workspace_members_all" on workspace_members;
create policy "workspace_members_all" on workspace_members for all using (true) with check (true);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null default 'barista',
  max_hours_per_week numeric(4, 1) not null check (
    max_hours_per_week >= 1 and max_hours_per_week <= 60
    and mod(max_hours_per_week * 2, 1) = 0
  ),
  hourly_rate numeric(8, 2) not null default 0,
  contract_type text not null default 'full_time' check (
    contract_type in ('full_time', 'part_time', 'temporary', 'intern')
  ),
  phone text not null default '',
  birth_date date,
  workspace_id uuid references workspaces(id) on delete cascade,
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
  workspace_id uuid references workspaces(id) on delete cascade,
  branch_name text not null default 'Kaviareň Centrum',
  min_staff_per_shift int not null default 2 check (min_staff_per_shift >= 1),
  meal_allowance numeric(8, 2) not null default 0,
  weekly_budget numeric(10, 2) not null default 0,
  gps_radius_m int not null default 100 check (gps_radius_m >= 0),
  workplace_lat numeric(10, 7),
  workplace_lng numeric(10, 7),
  legal_country text not null default 'sk' check (legal_country in ('sk', 'es')),
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
  overtime_hours numeric(6, 2),
  clock_in_lat numeric(10, 7),
  clock_in_lng numeric(10, 7),
  clock_out_lat numeric(10, 7),
  clock_out_lng numeric(10, 7)
);

create index if not exists idx_time_logs_employee on time_logs(employee_id);
create index if not exists idx_time_logs_shift on time_logs(shift_id);

alter table branch_settings enable row level security;
alter table time_logs enable row level security;

drop policy if exists "branch_settings_all" on branch_settings;
create policy "branch_settings_all" on branch_settings for all using (true) with check (true);

drop policy if exists "time_logs_all" on time_logs;
create policy "time_logs_all" on time_logs for all using (true) with check (true);

-- Enterprise tables

create table if not exists shift_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  shift_type text not null check (
    shift_type in ('morning', 'evening', 'full', 'off', 'sick')
  ),
  employee_id uuid references employees(id) on delete set null,
  recurrence text not null default 'weekly' check (
    recurrence in ('daily', 'weekly', 'biweekly', 'monthly', 'last_weekday')
  ),
  weekday int check (weekday >= 0 and weekday <= 6),
  created_at timestamptz not null default now()
);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null check (
    type in ('paid', 'sick', 'unpaid', 'bank_holiday', 'rtt')
  ),
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_leave_requests_employee on leave_requests(employee_id);
create index if not exists idx_leave_requests_status on leave_requests(status);

create table if not exists shift_swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references employees(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  cover_employee_id uuid references employees(id) on delete set null,
  exchange_shift_id uuid references shifts(id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_shift_swap_status on shift_swap_requests(status);
create index if not exists idx_shift_swap_requester on shift_swap_requests(requester_id);

create table if not exists leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type text not null check (
    leave_type in ('paid', 'sick', 'unpaid', 'bank_holiday', 'rtt')
  ),
  total_days numeric(5, 1) not null default 0,
  used_days numeric(5, 1) not null default 0,
  year int not null,
  unique (employee_id, leave_type, year)
);

create table if not exists hr_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  name text not null,
  type text not null check (type in ('contract', 'id', 'certificate', 'other')),
  url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_hr_documents_employee on hr_documents(employee_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references employees(id) on delete cascade,
  recipient_id uuid references employees(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_recipient on messages(recipient_id);
create index if not exists idx_messages_sender on messages(sender_id);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references employees(id) on delete cascade,
  schedule_published boolean not null default true,
  shift_changed boolean not null default true,
  leave_updated boolean not null default true,
  new_message boolean not null default true,
  document_reminder boolean not null default true
);

alter table shift_templates enable row level security;
alter table leave_requests enable row level security;
alter table shift_swap_requests enable row level security;
alter table leave_balances enable row level security;
alter table hr_documents enable row level security;
alter table messages enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_preferences enable row level security;

drop policy if exists "shift_templates_all" on shift_templates;
create policy "shift_templates_all" on shift_templates for all using (true) with check (true);

drop policy if exists "leave_requests_all" on leave_requests;
create policy "leave_requests_all" on leave_requests for all using (true) with check (true);

drop policy if exists "shift_swap_requests_all" on shift_swap_requests;
create policy "shift_swap_requests_all" on shift_swap_requests for all using (true) with check (true);

drop policy if exists "leave_balances_all" on leave_balances;
create policy "leave_balances_all" on leave_balances for all using (true) with check (true);

drop policy if exists "hr_documents_all" on hr_documents;
create policy "hr_documents_all" on hr_documents for all using (true) with check (true);

drop policy if exists "messages_all" on messages;
create policy "messages_all" on messages for all using (true) with check (true);

drop policy if exists "push_subscriptions_all" on push_subscriptions;
create policy "push_subscriptions_all" on push_subscriptions for all using (true) with check (true);

drop policy if exists "notification_preferences_all" on notification_preferences;
create policy "notification_preferences_all" on notification_preferences for all using (true) with check (true);

-- Migrations for existing databases
alter table employees add column if not exists hourly_rate numeric(8, 2) not null default 0;
alter table employees add column if not exists contract_type text not null default 'full_time';
alter table employees add column if not exists phone text not null default '';
alter table employees add column if not exists birth_date date;
alter table notification_preferences add column if not exists document_reminder boolean not null default true;

create table if not exists shift_swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references employees(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  cover_employee_id uuid references employees(id) on delete set null,
  exchange_shift_id uuid references shifts(id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  note text,
  created_at timestamptz not null default now()
);
alter table branch_settings add column if not exists meal_allowance numeric(8, 2) not null default 0;
alter table branch_settings add column if not exists weekly_budget numeric(10, 2) not null default 0;
alter table branch_settings add column if not exists gps_radius_m int not null default 100;
alter table branch_settings add column if not exists workplace_lat numeric(10, 7);
alter table branch_settings add column if not exists workplace_lng numeric(10, 7);
alter table branch_settings add column if not exists legal_country text not null default 'sk';
alter table time_logs add column if not exists clock_in_lat numeric(10, 7);
alter table time_logs add column if not exists clock_in_lng numeric(10, 7);
alter table time_logs add column if not exists clock_out_lat numeric(10, 7);
alter table time_logs add column if not exists clock_out_lng numeric(10, 7);

-- Workspaces migration (run on existing databases)
create table if not exists workspaces (
  id uuid primary key,
  name text not null default 'My business',
  invite_code text unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table workspaces enable row level security;
drop policy if exists "workspaces_all" on workspaces;
create policy "workspaces_all" on workspaces for all using (true) with check (true);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);
alter table workspace_members enable row level security;
drop policy if exists "workspace_members_all" on workspace_members;
create policy "workspace_members_all" on workspace_members for all using (true) with check (true);

alter table workspaces add column if not exists name text not null default 'My business';
alter table workspaces add column if not exists invite_code text unique;
alter table workspaces add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table employees add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table branch_settings add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table shift_templates add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

create index if not exists idx_employees_workspace on employees(workspace_id);
create index if not exists idx_branch_settings_workspace on branch_settings(workspace_id);
create index if not exists idx_shift_templates_workspace on shift_templates(workspace_id);

-- Email unique per workspace (not globally — different cafés can share patterns)
alter table employees drop constraint if exists employees_email_key;
drop index if exists employees_email_key;
drop index if exists employees_workspace_email_unique;
create unique index employees_workspace_email_unique
  on employees (workspace_id, lower(email))
  where workspace_id is not null;

-- No demo employees: each visitor starts with an empty workspace (created by the app).
