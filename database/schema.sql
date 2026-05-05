-- MSHS IT Help Desk Supabase/PostgreSQL schema
-- Run this in Supabase SQL Editor. This is the corrected version where
-- out_of_warranty_allocation is loan_type, not device_type.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin','it_staff','teacher','viewer');
create type device_status as enum ('available','loaned','damaged','maintenance','out_of_warranty','retired','archived');
create type device_type as enum ('loan_laptop','warranty_laptop','staff_laptop','lab_computer','projector','printer','other');
create type loan_type as enum ('short_term','long_term','emergency','out_of_warranty_allocation');
create type loan_status as enum ('active','due_soon','overdue','returned','cancelled','archived');
create type application_status as enum ('pending','approved','declined','withdrawn','assigned','archived');
create type issue_status as enum ('open','in_progress','waiting_on_user','resolved','closed','archived');
create type priority_level as enum ('low','medium','high','urgent');
create type damage_severity as enum ('minor','moderate','major','critical');
create type damage_status as enum ('reported','investigating','repairing','repaired','replaced','written_off','archived');

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text unique not null,
  role user_role not null default 'teacher',
  faculty_or_team text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  student_id text unique,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  year_level integer check (year_level between 7 and 12),
  roll_class text,
  parent_carer_name text,
  parent_carer_email text,
  parent_carer_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  asset_number text unique not null,
  serial_number text unique,
  model text not null,
  manufacturer text,
  device_type device_type not null default 'loan_laptop',
  status device_status not null default 'available',
  purchase_date date,
  warranty_expiry date,
  charger_included boolean not null default true,
  accessories_included text,
  current_location text,
  assigned_to_student_id uuid references students(id) on delete set null,
  assigned_to_staff_user_id uuid references app_users(id) on delete set null,
  condition_notes text,
  admin_notes text,
  archived_at timestamptz,
  archived_by uuid references app_users(id) on delete set null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  application_reference text unique not null default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12)),
  student_first_name text not null,
  student_last_name text not null,
  student_id text,
  year_level integer check (year_level between 7 and 12),
  parent_carer_name text not null,
  parent_carer_email text not null,
  parent_carer_phone text,
  requested_loan_type loan_type not null default 'short_term',
  requested_start_date date,
  requested_end_date date,
  reason_for_request text not null,
  agreement_accepted boolean not null default false,
  digital_signature text,
  status application_status not null default 'pending',
  reviewed_by uuid references app_users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  assigned_device_id uuid references devices(id) on delete set null,
  created_student_id uuid references students(id) on delete set null,
  submitted_ip text,
  submitted_user_agent text,
  archived_at timestamptz,
  archived_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table device_loans (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  application_id uuid references loan_applications(id) on delete set null,
  loan_type loan_type not null default 'short_term',
  status loan_status not null default 'active',
  issued_date date not null default current_date,
  expected_return_date date,
  actual_return_date date,
  issued_by uuid references app_users(id) on delete set null,
  returned_to uuid references app_users(id) on delete set null,
  issue_condition_notes text,
  return_condition_notes text,
  charger_issued boolean not null default true,
  charger_returned boolean,
  parent_reminder_email text,
  last_reminder_sent_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_return_date check (actual_return_date is null or actual_return_date >= issued_date)
);

create table device_activity (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  activity_type text not null,
  activity_title text not null,
  activity_notes text,
  performed_by uuid references app_users(id) on delete set null,
  related_student_id uuid references students(id) on delete set null,
  created_at timestamptz not null default now()
);

create table email_reminders (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references device_loans(id) on delete cascade,
  application_id uuid references loan_applications(id) on delete set null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  message_body text not null,
  reminder_type text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text not null default 'draft',
  error_message text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table it_issues (
  id uuid primary key default gen_random_uuid(),
  issue_reference text unique not null default 'ISS-' || to_char(now(), 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  reported_by_name text not null,
  reported_by_email text,
  reported_by_user_id uuid references app_users(id) on delete set null,
  reporter_role text default 'teacher',
  location text,
  room_or_lab text,
  issue_type text not null,
  device_asset_number text,
  device_id uuid references devices(id) on delete set null,
  title text not null,
  description text not null,
  priority priority_level not null default 'medium',
  status issue_status not null default 'open',
  assigned_to uuid references app_users(id) on delete set null,
  due_date date,
  generated_activity_note text,
  suggested_actions text,
  resolved_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table it_issue_notes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references it_issues(id) on delete cascade,
  note_type text not null default 'internal_note',
  note_body text not null,
  created_by uuid references app_users(id) on delete set null,
  created_by_name text,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);

create table labs (
  id uuid primary key default gen_random_uuid(),
  lab_name text unique not null,
  building text,
  room_number text,
  number_of_computers integer not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lab_computers (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs(id) on delete cascade,
  computer_number text not null,
  device_id uuid references devices(id) on delete set null,
  status device_status not null default 'available',
  x_position integer,
  y_position integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lab_id, computer_number)
);

create table damage_reports (
  id uuid primary key default gen_random_uuid(),
  damage_reference text unique not null default 'DMG-' || to_char(now(), 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  reported_by_name text not null,
  reported_by_email text,
  reported_by_user_id uuid references app_users(id) on delete set null,
  lab_id uuid references labs(id) on delete set null,
  lab_computer_id uuid references lab_computers(id) on delete set null,
  device_id uuid references devices(id) on delete set null,
  location text,
  computer_number text,
  device_asset_number text,
  damage_type text not null,
  severity damage_severity not null default 'moderate',
  status damage_status not null default 'reported',
  student_involved_id uuid references students(id) on delete set null,
  student_involved_name text,
  description text not null,
  photo_url text,
  follow_up_required boolean not null default true,
  assigned_to uuid references app_users(id) on delete set null,
  repair_notes text,
  repaired_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id) on delete set null,
  actor_name text,
  actor_email text,
  action text not null,
  table_name text not null,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_devices_status on devices(status);
create index idx_devices_type on devices(device_type);
create index idx_devices_warranty_expiry on devices(warranty_expiry);
create index idx_device_loans_status on device_loans(status);
create index idx_device_loans_expected_return_date on device_loans(expected_return_date);
create index idx_loan_applications_status on loan_applications(status);
create index idx_it_issues_status on it_issues(status);
create index idx_damage_reports_status on damage_reports(status);

create trigger trg_app_users_updated_at before update on app_users for each row execute function set_updated_at();
create trigger trg_students_updated_at before update on students for each row execute function set_updated_at();
create trigger trg_devices_updated_at before update on devices for each row execute function set_updated_at();
create trigger trg_loan_applications_updated_at before update on loan_applications for each row execute function set_updated_at();
create trigger trg_device_loans_updated_at before update on device_loans for each row execute function set_updated_at();
create trigger trg_email_reminders_updated_at before update on email_reminders for each row execute function set_updated_at();
create trigger trg_it_issues_updated_at before update on it_issues for each row execute function set_updated_at();
create trigger trg_labs_updated_at before update on labs for each row execute function set_updated_at();
create trigger trg_lab_computers_updated_at before update on lab_computers for each row execute function set_updated_at();
create trigger trg_damage_reports_updated_at before update on damage_reports for each row execute function set_updated_at();

alter table app_users enable row level security;
alter table students enable row level security;
alter table devices enable row level security;
alter table device_activity enable row level security;
alter table loan_applications enable row level security;
alter table device_loans enable row level security;
alter table email_reminders enable row level security;
alter table it_issues enable row level security;
alter table it_issue_notes enable row level security;
alter table labs enable row level security;
alter table lab_computers enable row level security;
alter table damage_reports enable row level security;
alter table audit_log enable row level security;

create policy "Public can submit loan applications" on loan_applications for insert to anon with check (agreement_accepted = true);

-- Seed data
insert into app_users (full_name,email,role,faculty_or_team) values
('Bradly Saunders','bradly.saunders@example.com','admin','Digital Technologies'),
('IT Admin User','itadmin@example.com','it_staff','IT Help Desk'),
('James Patel','james.patel@example.com','it_staff','IT Help Desk'),
('Sarah Nguyen','sarah.nguyen@example.com','it_staff','IT Help Desk'),
('Laura Carter','laura.carter@example.com','teacher','Science');

insert into devices (asset_number,serial_number,model,manufacturer,device_type,status,purchase_date,warranty_expiry,charger_included,condition_notes) values
('MSHS-LAP-0001','8X2XJY3','Dell Latitude 5440','Dell','loan_laptop','available','2024-06-15','2026-06-14',true,'Good condition'),
('MSHS-LAP-0002','1FZ2K73','Dell Latitude 5440','Dell','loan_laptop','loaned','2024-06-15','2025-12-21',true,'Good condition'),
('MSHS-LAP-0007','6Y3TMD0','Dell Latitude 5440','Dell','loan_laptop','out_of_warranty','2021-03-12','2024-03-12',true,'Out of warranty, usable');
