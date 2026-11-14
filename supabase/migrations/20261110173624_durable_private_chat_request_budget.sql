create table private.chat_budget_keys (
 key_digest bytea primary key check (octet_length(key_digest) = 32),
 scope text not null unique check (scope in ('preview','production')),
 minute_limit integer not null check (minute_limit between 1 and 60),
 day_limit integer not null check (day_limit between 1 and 1000)
);
create table private.chat_budget_windows (
 scope text primary key references private.chat_budget_keys(scope) on delete cascade,
 minute_started timestamptz not null,
 day_started timestamptz not null,
 minute_count integer not null,
 day_count integer not null
);
alter table private.chat_budget_keys enable row level security;
alter table private.chat_budget_windows enable row level security;
revoke all on private.chat_budget_keys,private.chat_budget_windows from public,anon,authenticated;

create function private.reserve_chat_request(server_key text) returns boolean
language plpgsql security definer set search_path='' as $$
declare
 budget private.chat_budget_keys;
 counter private.chat_budget_windows;
 now_minute timestamptz:=date_trunc('minute',statement_timestamp());
 now_day timestamptz:=date_trunc('day',statement_timestamp(),'UTC');
begin
 if server_key is null or length(server_key) not between 32 and 128 then return false; end if;
 select * into budget from private.chat_budget_keys
 where key_digest=sha256(convert_to(server_key,'UTF8')) for share;
 if not found then return false; end if;
 insert into private.chat_budget_windows values(budget.scope,now_minute,now_day,0,0)
 on conflict(scope) do nothing;
 select * into counter from private.chat_budget_windows where scope=budget.scope for update;
 -- A queued request can start before the currently recorded window. Never
 -- reset a counter backwards or allow such a request to bypass the cap.
 if now_minute>counter.minute_started then
  counter.minute_started:=now_minute;
  counter.minute_count:=0;
 end if;
 if now_day>counter.day_started then
  counter.day_started:=now_day;
  counter.day_count:=0;
 end if;
 if counter.minute_count>=budget.minute_limit or counter.day_count>=budget.day_limit then return false; end if;
 update private.chat_budget_windows set
  minute_started=counter.minute_started,day_started=counter.day_started,
  minute_count=counter.minute_count+1,day_count=counter.day_count+1
 where scope=budget.scope;
 return true;
end;
$$;
-- The parsed SQL body binds the private function without giving anon usage of
-- the private schema. Only the digest-matched server key can reserve capacity.
create function public.reserve_chat_request(server_key text) returns boolean
language sql security invoker set search_path=''
begin atomic
 select private.reserve_chat_request(server_key);
end;
revoke all on function private.reserve_chat_request(text),public.reserve_chat_request(text) from public,anon,authenticated;
grant execute on function private.reserve_chat_request(text),public.reserve_chat_request(text) to anon;
