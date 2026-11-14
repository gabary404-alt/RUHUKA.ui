
create policy private_contacts_read_scope on public.student_private_contacts as restrictive for select to authenticated
using(private.has_school_role(array['headmaster','discipline_officer']));
create policy private_contacts_insert_scope on public.student_private_contacts as restrictive for insert to authenticated
with check(private.has_school_role(array['headmaster']));
create policy private_contacts_update_scope on public.student_private_contacts as restrictive for update to authenticated
using(private.has_school_role(array['headmaster'])) with check(private.has_school_role(array['headmaster']));
create policy private_contacts_delete_scope on public.student_private_contacts as restrictive for delete to authenticated
using(private.has_school_role(array['headmaster']));
