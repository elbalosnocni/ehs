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
  ,getPublicStats:function(payload){
    // Public endpoint: chỉ trả số liệu tổng hợp, tuyệt đối không trả dòng hồ sơ/PII.
    const year=Math.max(2000,Math.min(2100,Number(payload.year||new Date().getFullYear())));
    const countYear=(sheet,dateFields)=>Utils.getSheetData(sheet).filter(r=>{const raw=dateFields.map(k=>r[k]).find(Boolean);const d=raw?new Date(raw):null;return d&&!isNaN(d)&&d.getFullYear()===year;});
    const incidents=countYear(CONFIG.SHEETS.ACCIDENT,['IncidentDate']);
    const near=countYear(CONFIG.SHEETS.NEAR_MISS,['EventDate']);
    const unsafeAct=countYear(CONFIG.SHEETS.UNSAFE_ACT,['EventDate']);
    const unsafeCondition=countYear(CONFIG.SHEETS.UNSAFE_CONDITION,['EventDate']);
    const inspections=countYear(CONFIG.SHEETS.INSPECTION,['InspectionDate']);
    const trainings=countYear(CONFIG.SHEETS.TRAINING,['TrainingDate']);
    const risks=countYear(CONFIG.SHEETS.RISK_ASSESSMENT,['AssessmentDate']);
    const capa=Utils.getSheetData(CONFIG.SHEETS.CAPA).filter(x=>{const raw=x.CompletedDate||x.CreatedDate||x.DueDate;const d=raw?new Date(raw):null;return d&&!isNaN(d)&&d.getFullYear()===year;});
    const closed=capa.filter(x=>/đã đóng|closed|verified/i.test(String(x.Status||''))).length;
    const hours=Utils.getSheetData(CONFIG.SHEETS.WORKING_HOURS).filter(x=>Number(x.Year)===year).reduce((n,x)=>n+Number(x.Hours||0),0);
    const monthly=Array(12).fill(0);incidents.forEach(x=>{const d=new Date(x.IncidentDate);if(!isNaN(d))monthly[d.getMonth()]++;});
    return Utils.ok({year:year,public:true,kpi:{incident:incidents.length,nearMiss:near.length,unsafeAct:unsafeAct.length,unsafeCondition:unsafeCondition.length,capaClosed:closed,capaTotal:capa.length,inspection:inspections.length,training:trainings.length,riskAssessment:risks.length,trainingAttendees:trainings.reduce((n,x)=>n+Number(x.AttendeeCount||0),0),workingHours:hours},charts:{monthly:monthly}});
  }

};
