create extension if not exists pg_stat_statements;

-- Highest total row transfer. Look for broad list queries or repeated report JSON fetches.
select
  query,
  calls,
  rows as total_rows,
  case when calls = 0 then 0 else rows / calls end as avg_rows_per_call
from pg_stat_statements
where calls > 0
order by rows desc
limit 10;

-- Highest frequency queries. These are candidates for caching or user-triggered refresh.
select
  query,
  calls,
  rows as total_rows,
  case when calls = 0 then 0 else rows / calls end as avg_rows_per_call
from pg_stat_statements
where calls > 0
order by calls desc
limit 10;

-- Largest tables and indexes in the current database.
select
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_indexes_size(relid)) as index_size
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc
limit 20;

-- Dead tuple pressure. Consider vacuuming tables with high dead rows.
select
  relname as table_name,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
order by n_dead_tup desc
limit 20;

-- Reset only when starting a fresh measurement window.
-- select pg_stat_statements_reset();
