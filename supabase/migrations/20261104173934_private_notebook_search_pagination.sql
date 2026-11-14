
create or replace function public.search_personal_notes(target_notebook uuid,query_text text default '',page_offset integer default 0)
returns table(id uuid,title text,preview text,updated_at timestamptz,total_count bigint)
language plpgsql stable security invoker set search_path='' as $$
begin
 if page_offset is null or page_offset<0 or page_offset>100000 or query_text is null or length(query_text)>200 then
 raise exception 'Invalid notebook search or page'; end if;
 return query select n.id,n.title,left(n.body,140),n.updated_at,count(*) over()
 from public.personal_notes n where n.notebook_id=target_notebook
 and (query_text='' or position(lower(query_text) in lower(n.title))>0 or position(lower(query_text) in lower(n.body))>0)
 order by n.updated_at desc,n.id asc limit 50 offset page_offset;
end;
$$;
revoke all on function public.search_personal_notes(uuid,text,integer) from public,anon;
grant execute on function public.search_personal_notes(uuid,text,integer) to authenticated;
