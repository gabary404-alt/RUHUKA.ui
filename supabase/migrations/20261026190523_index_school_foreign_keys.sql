do $$
declare
  fk record;
  index_name text;
begin
  for fk in
    select c.conrelid::regclass as table_ref,
           t.relname as table_name,
           a.attname as column_name,
           k.attnum as column_number
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join lateral unnest(c.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid and i.indisvalid
          and (i.indkey::smallint[])[0] = k.attnum
      )
  loop
    index_name := left(fk.table_name || '_' || fk.column_name || '_idx', 55);
    execute format('create index if not exists %I on %s (%I)',
                   index_name, fk.table_ref, fk.column_name);
  end loop;
end $$;
