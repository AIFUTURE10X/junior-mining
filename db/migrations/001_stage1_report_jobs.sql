create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  exchange text not null default '',
  name text not null,
  commodity text,
  stage text,
  jurisdiction text,
  market_cap_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exchange, ticker)
);

create table if not exists report_jobs (
  id text primary key,
  user_id uuid references users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  status text not null check (status in ('queued', 'processing', 'ready', 'failed')),
  company text not null,
  ticker text not null,
  input jsonb not null,
  report jsonb,
  error text,
  requested_at timestamptz not null,
  updated_at timestamptz not null,
  status_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists report_jobs_status_updated_idx on report_jobs (status, updated_at desc);
create index if not exists report_jobs_company_idx on report_jobs (company_id, updated_at desc);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  report_job_id text references report_jobs(id) on delete cascade,
  title text,
  url text,
  file_name text,
  source_type text not null default 'submitted',
  extracted_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sources_report_job_idx on sources (report_job_id);

create table if not exists reports (
  id text primary key,
  report_job_id text not null unique references report_jobs(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  generated_at timestamptz not null,
  rating text not null,
  confidence integer not null check (confidence >= 0 and confidence <= 100),
  summary jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  catalysts jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  hype jsonb not null default '{}'::jsonb,
  expert_signals jsonb not null default '{}'::jsonb,
  valuation jsonb not null default '{}'::jsonb,
  disclaimer text not null,
  full_report jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_company_generated_idx on reports (company_id, generated_at desc);
create index if not exists reports_rating_idx on reports (rating);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references reports(id) on delete cascade,
  sort_order integer not null default 0,
  evidence_type text not null,
  source text not null,
  cue text,
  finding text not null,
  confidence text not null,
  created_at timestamptz not null default now()
);

create index if not exists evidence_items_report_idx on evidence_items (report_id, sort_order);

create table if not exists scorecard_items (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references reports(id) on delete cascade,
  category_key text not null,
  score numeric(4, 1) not null,
  confidence text not null,
  rationale text not null,
  created_at timestamptz not null default now(),
  unique (report_id, category_key)
);

create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  latest_report_id text references reports(id) on delete set null,
  user_tags jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  report_id text references reports(id) on delete cascade,
  alert_type text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists alerts_user_status_idx on alerts (user_id, status, created_at desc);
create index if not exists alerts_company_idx on alerts (company_id, created_at desc);
