-- Server-only atomic quotas. No end-user data, tokens or raw IPs are stored.
create table if not exists public.school_abuse_budgets (
 scope text not null check (length(scope) between 1 and 60),
 identity_hash text not null check (identity_hash ~ '^[0-9a-f]{64}$'),
 used integer not null check (used >= 0),
 expires_at timestamptz not null,
 primary key (scope, identity_hash)
);
alter table public.school_abuse_budgets enable row level security;
revoke all on public.school_abuse_budgets from public, anon, authenticated;
grant select, insert, update, delete on public.school_abuse_budgets to service_role;
create index if not exists school_abuse_budget_expiry_idx on public.school_abuse_budgets(expires_at);
create or replace function public.school_consume_budget(p_scope text, p_identity text, p_limit integer, p_seconds integer, p_amount integer default 1)
returns boolean language plpgsql security definer set search_path = '' as $$
declare accepted boolean; fresh boolean; boundary timestamptz; stamp timestamptz := clock_timestamp();
begin
 if length(p_scope) not between 1 and 60 or p_identity !~ '^[0-9a-f]{64}$' or p_limit not between 1 and 10000 or p_seconds not between 60 and 86400 or p_amount not between 1 and p_limit then return false; end if;
 boundary := to_timestamp((floor(extract(epoch from stamp)/p_seconds)+1)*p_seconds);
 insert into public.school_abuse_budgets as b(scope,identity_hash,used,expires_at)
 values(p_scope,p_identity,p_amount,boundary)
 on conflict(scope,identity_hash) do update set
 used=case when b.expires_at<=stamp then p_amount else b.used+p_amount end,
 expires_at=case when b.expires_at<=stamp then boundary else b.expires_at end
 where b.expires_at<=stamp or b.used+p_amount<=p_limit
 returning true, used=p_amount into accepted,fresh;
 -- Clean expired operational counters only when a daily global window starts.
 if accepted and fresh and p_scope='newsletter-site-day' then
  delete from public.school_abuse_budgets where expires_at < stamp-interval '2 days';
 end if;
 return coalesce(accepted,false);
end $$;
revoke all on function public.school_consume_budget(text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.school_consume_budget(text,text,integer,integer,integer) to service_role;
notify pgrst,'reload schema';
