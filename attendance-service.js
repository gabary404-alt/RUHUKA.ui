/* Inject an authenticated Supabase client. No privileged keys or demo fallback. */
(function(root) {
  function createAttendanceService(client) {
    async function call(name,args) {
      const {data,error}=await client.rpc(name,args);
      if(error) {
        const failure=new Error(error.code==='23505' ? 'Main attendance for this class and day has already been submitted.' : error.message || 'Attendance could not be saved.');
        failure.code=error.code; throw failure;
      }
      return data;
    }
    return Object.freeze({
      submit(className,date,rows) {
        return call('submit_main_attendance',{target_class:className,day:date,marks:rows.map(row=>({student_id:row.studentId,status:row.status}))});
      },
      correct(recordId,status,reason) {
        return call('correct_main_attendance',{record_id:recordId,new_status:status,reason});
      },
      overview(date) { return call('main_attendance_overview',{day:date}); }
    });
  }
  if(typeof module!=='undefined' && module.exports) module.exports={createAttendanceService};
  else root.createAttendanceService=createAttendanceService;
})(typeof window!=='undefined'?window:globalThis);
