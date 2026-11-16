const Dashboard = {
  getStats:function(payload){
    const s=Utils.requireAuth(payload.token);const year=Number(payload.year||new Date().getFullYear());
    const accidents=Utils.scopeRows(Utils.getSheetData(CONFIG.SHEETS.ACCIDENT),s,payload).filter(a=>{const d=new Date(a.IncidentDate);return !isNaN(d)&&d.getFullYear()===year;});
    const employees=Utils.scopeRows(Utils.getSheetData(CONFIG.SHEETS.EMPLOYEE),s,payload).filter(e=>String(e.Status||'Active').toLowerCase()!=='inactive');
    const capa=Utils.getSheetData(CONFIG.SHEETS.CAPA).filter(c=>{const a=Utils.getSheetData(CONFIG.SHEETS.ACCIDENT).find(x=>String(x.AccidentID)===String(c.AccidentID));const r=a||c;return (!s.plant||String(r.Plant||'')===String(s.plant))&&(!s.department||String(r.Department||'')===String(s.department));}),inv=Utils.getSheetData(CONFIG.SHEETS.INVESTIGATION);
    const incidentIds=new Set(accidents.map(a=>String(a.AccidentID)));const daysByIncident={};
    accidents.forEach(a=>daysByIncident[String(a.AccidentID)]=Math.max(0,Number(a.LostDays||0)));
    Utils.getSheetData(CONFIG.SHEETS.BHXH).filter(x=>{const d=new Date(x.StartDate||x.CreatedDate);return !isNaN(d)&&d.getFullYear()===year;}).forEach(x=>{const id=String(x.AccidentID||'');if(id&&incidentIds.has(id))daysByIncident[id]=Math.max(daysByIncident[id]||0,Number(x.TotalDaysOff||0));});
    const lostDays=Object.values(daysByIncident).reduce((a,b)=>a+b,0);
    const setting=Utils.getSheetData(CONFIG.SHEETS.SETTING);const hoursSetting=setting.find(x=>String(x.Key)==='WORKING_HOURS_'+year);const hourRows=Utils.getSheetData(CONFIG.SHEETS.WORKING_HOURS).filter(x=>Number(x.Year)===year&&(!payload.plant||String(x.Plant)===String(payload.plant))&&(!payload.department||String(x.Department)===String(payload.department)));const actualHours=hourRows.reduce((n,x)=>n+Number(x.Hours||0),0);const hours=hourRows.length?actualHours:(hoursSetting?Number(hoursSetting.Value||0):0);
    const recordable=accidents.filter(x=>/medical treatment|lost time|serious|nghiêm trọng|rất nghiêm trọng|fatal/i.test(String(x.Classification||x.IncidentType||x.Severity||''))).length;
    const monthly=Array(12).fill(0),dept={},cause={},severity={};
    accidents.forEach(a=>{const d=new Date(a.IncidentDate);if(!isNaN(d))monthly[d.getMonth()]++;const k=a.Department||'Khác';dept[k]=(dept[k]||0)+1;const c=a.ImmediateCause||a.InjuryFactor||'Chưa phân loại';cause[c]=(cause[c]||0)+1;const sv=a.Severity||'Chưa phân loại';severity[sv]=(severity[sv]||0)+1;});
    const overdue=capa.filter(c=>c.DueDate&&String(c.Status)!=='Đã đóng'&&new Date(c.DueDate)<new Date()).length;
    return Utils.ok({year:year,kpi:{employee:employees.length,accident:accidents.length,recordable:recordable,lostDays:lostDays,workingHours:hours,workingHoursSource:hourRows.length?'WORKING_HOURS':(hoursSetting?'SETTING':'NOT_CONFIGURED'),FR:hours?(accidents.length*1000000/hours).toFixed(2):null,TRIR:hours?(recordable*200000/hours).toFixed(2):null,SR:hours?(lostDays*1000000/hours).toFixed(2):null,openCapa:capa.filter(c=>String(c.Status)!=='Đã đóng').length,overdueCapa:overdue,openInvestigation:inv.filter(i=>String(i.Status)!=='Đã phê duyệt').length},charts:{monthly:monthly,department:this.map(dept),cause:this.map(cause),severity:this.map(severity)}});},
  map:function(o){return {labels:Object.keys(o),data:Object.values(o)};}
};
