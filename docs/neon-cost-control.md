# Neon Cost Control Plan

Goal: keep OreIQ from waking Neon or transferring data unless a user actually asks for database-backed work.

## What changed in the app

- The app no longer reads from Neon on initial page load.
- Hosted mode now uses on-demand Neon sync:
  - submitting a report creates the report job in Neon;
  - clicking Refresh manually loads recent hosted jobs;
  - opening a ready hosted job fetches the full report only for that job.
- The report-job list API returns compact job summaries instead of `SELECT *` with full report JSON.
- Direct `file:///` mode still uses localStorage and can generate the sample report without Neon.

## Recommended Neon settings

For development, preview, and test branches:

- Enable scale to zero.
- Keep the compute minimum at the lowest available size.
- Cap autoscaling low, usually 0.25 to 0.5 CU while the app is still early.
- Delete unused preview branches or set branch expiration.
- Avoid scheduled jobs that ping the database every few minutes.

For production while traffic is low:

- Start with the smallest compute that keeps the app usable.
- Consider scale to zero if cold starts are acceptable.
- Keep autoscaling max conservative until there are real users.
- Raise limits only after usage proves the need.

## Hard quota script

Use this only when you want a hard stop. When Neon project quotas are hit, active computes are suspended and do not automatically wake on the next request.

```powershell
$env:NEON_API_KEY = "your-api-key"
.\scripts\set-neon-project-quotas.ps1 -ProjectId "project-id" -ActiveHours 10 -ComputeHours 3 -WrittenGb 1 -BranchSizeGb 1
```

Suggested early OreIQ limits:

- Development or test project: `ActiveHours 10`, `ComputeHours 3`, `WrittenGb 1`, `BranchSizeGb 1`
- Production MVP: `ActiveHours 50`, `ComputeHours 15`, `WrittenGb 2`, `BranchSizeGb 2`

## Diagnostics

Run `db/maintenance/neon_usage_diagnostics.sql` in the Neon SQL editor to find:

- queries returning the most rows;
- most frequently called queries;
- largest tables and indexes;
- tables with dead tuple pressure.

Do not run `VACUUM FULL` casually on production. It locks the table and can temporarily increase storage while it rewrites the table.

## First cleanup targets

1. Delete unused Neon projects that are not tied to an active app.
2. Delete old preview branches.
3. Enable automatic preview branch cleanup in the Neon/Vercel integration.
4. Reduce autoscaling maximums on non-production computes.
5. Set project quotas for experiments that should not exceed a small monthly allowance.
