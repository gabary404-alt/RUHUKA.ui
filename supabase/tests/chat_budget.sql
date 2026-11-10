begin;
insert into private.chat_budget_keys values
 (sha256(convert_to('fixture-preview-not-a-secret-000000','UTF8')),'preview',2,2),
 (sha256(convert_to('fixture-production-not-secret-0000','UTF8')),'production',3,4);
set local role anon;
do $$
begin
 if public.reserve_chat_request('wrong') then raise exception 'Unauthorised reservation'; end if;
 if has_schema_privilege('anon','private','usage') then raise exception 'Private schema became accessible'; end if;
 if not public.reserve_chat_request('fixture-preview-not-a-secret-000000') or
    not public.reserve_chat_request('fixture-preview-not-a-secret-000000') then raise exception 'Valid budget denied'; end if;
 if public.reserve_chat_request('fixture-preview-not-a-secret-000000') then raise exception 'Budget exceeded'; end if;
 if not public.reserve_chat_request('fixture-production-not-secret-0000') then raise exception 'Budgets not isolated'; end if;
end $$;
reset role;
update private.chat_budget_windows set minute_started=minute_started-interval '2 minutes' where scope='preview';
set local role anon;
do $$begin
 if public.reserve_chat_request('fixture-preview-not-a-secret-000000') then raise exception 'Daily cap reset by minute rollover'; end if;
end $$;
reset role;
rollback;
