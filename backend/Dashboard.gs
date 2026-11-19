function ehsParseDate_(v){
  if(v instanceof Date&&!isNaN(v.getTime()))return v;
  if(v===null||v===undefined||v==='')return null;
  if(typeof v==='number'&&v>20000&&v<80000)return new Date(Date.UTC(1899,11,30)+v*86400000);
  const s=String(v).trim();if(!s)return null;let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+.*)?$/);
  if(m){let y=+m[3];if(y<100)y+=y>=70?1900:2000;const d=new Date(y,+m[2]-1,+m[1]);return d.getFullYear()===y&&d.getMonth()===+m[2]-1&&d.getDate()===+m[1]?d:null;}
  m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);if(m){const d=new Date(+m[1],+m[2]-1,+m[3]);return d.getFullYear()===+m[1]&&d.getMonth()===+m[2]-1&&d.getDate()===+m[3]?d:null;}
  const d=new Date(s);return isNaN(d.getTime())?null:d;
}
function ehsYear_(v){const d=ehsParseDate_(v);return d?d.getFullYear():null;}
function ehsIsRecordable_(a){
 const c=String(a.Classification||'').toLowerCase(),t=String(a.IncidentType||'').toLowerCase(),m=String(a.MedicalRequired||'').toLowerCase(),l=String(a.LostTime||'').toLowerCase();
 if(/near[\s_-]*miss|suýt/.test(c+' '+t))return false;
 if(['true','yes','1','có'].includes(m)||['true','yes','1','có'].includes(l)||Number(a.LostDays||0)>0)return true;
 return /medical treatment|recordable|lost time|fatal|điều trị y tế|nghỉ việc|tử vong|chết người/.test(c);
}
const Dashboard={
 getStats:function(payload){
  payload=payload||{};const s=Utils.requireAuth(payload.token),year=Number(payload.year||new Date().getFullYear()),plant=String(payload.plant||'').trim(),department=String(payload.department||'').trim();
  const allAcc=Utils.scopeRows(Utils.getSheetData(CONFIG.SHEETS.ACCIDENT),s,{});
  const inScope=rows=>Utils.scopeRows(rows,s,{plant:plant,department:department});
  const accidents=inScope(allAcc).filter(a=>ehsYear_(a.IncidentDate)===year),ids=new Set(accidents.map(a=>String(a.AccidentID)));
  const employees=inScope(Utils.getSheetData(CONFIG.SHEETS.EMPLOYEE)).filter(e=>String(e.Status||'Active').toLowerCase()!=='inactive');
  const byId={};allAcc.forEach(a=>byId[String(a.AccidentID)]=a);
  const scopedRelated=row=>{const a=byId[String(row.AccidentID||'')],o=a||row;return (!s.plant||String(o.Plant||'')===String(s.plant))&&(!s.department||String(o.Department||'')===String(s.department))&&(!plant||String(o.Plant||'')===plant)&&(!department||String(o.Department||'')===department);};
  const capa=Utils.getSheetData(CONFIG.SHEETS.CAPA).filter(c=>scopedRelated(c)&&((byId[String(c.AccidentID||'')]&&ehsYear_(byId[String(c.AccidentID)].IncidentDate)===year)||ehsYear_(c.CreatedDate)===year));
  const inv=Utils.getSheetData(CONFIG.SHEETS.INVESTIGATION).filter(i=>scopedRelated(i)&&((byId[String(i.AccidentID||'')]&&ids.has(String(i.AccidentID)))||ehsYear_(i.InvestigationDate)===year));
  const lost={};accidents.forEach(a=>lost[String(a.AccidentID)]=Math.max(0,Number(a.LostDays||0)));
  Utils.getSheetData(CONFIG.SHEETS.BHXH).filter(x=>ids.has(String(x.AccidentID||''))&&ehsYear_(x.StartDate||x.CreatedDate)===year).forEach(x=>{const id=String(x.AccidentID);lost[id]=Math.max(lost[id]||0,Math.max(0,Number(x.TotalDaysOff||0)));});
  const lostDays=Object.values(lost).reduce((a,b)=>a+b,0),settings=Utils.getSheetData(CONFIG.SHEETS.SETTING),setting=settings.find(x=>String(x.Key)==='WORKING_HOURS_'+year);
  const hoursRows=inScope(Utils.getSheetData(CONFIG.SHEETS.WORKING_HOURS)).filter(x=>Number(x.Year)===year),hours=hoursRows.length?hoursRows.reduce((n,x)=>n+Number(x.Hours||0),0):(setting?Number(setting.Value||0):0);
  const recordable=accidents.filter(ehsIsRecordable_).length,monthly=Array(12).fill(0),dept={},cause={},severity={};
  accidents.forEach(a=>{const d=ehsParseDate_(a.IncidentDate);if(d)monthly[d.getMonth()]++;const k=a.Department||'Chưa phân loại';dept[k]=(dept[k]||0)+1;const c=a.ImmediateCause||a.InjuryFactor||'Chưa phân loại';cause[c]=(cause[c]||0)+1;const v=a.Severity||'Chưa phân loại';severity[v]=(severity[v]||0)+1;});
  const closed=c=>/đã đóng|closed|verified|hoàn tất|completed/i.test(String(c.Status||''));
  const overdue=capa.filter(c=>c.DueDate&&!closed(c)&&ehsParseDate_(c.DueDate)&&ehsParseDate_(c.DueDate).getTime()<Date.now()).length;
  const years=[...new Set(allAcc.map(a=>ehsYear_(a.IncidentDate)).filter(Boolean))].sort((a,b)=>b-a);if(!years.includes(year))years.unshift(year);
  const plants=[...new Set(allAcc.map(a=>String(a.Plant||'').trim()).filter(Boolean))].sort();
  const departments=[...new Set(allAcc.filter(a=>!plant||String(a.Plant||'')===plant).map(a=>String(a.Department||'').trim()).filter(Boolean))].sort();
  return Utils.ok({year,filters:{plant,department},filterOptions:{years,plants,departments},kpi:{employee:employees.length,accident:accidents.length,recordable,lostDays,workingHours:hours,workingHoursSource:hoursRows.length?'WORKING_HOURS':(setting?'SETTING':'NOT_CONFIGURED'),FR:hours?(accidents.length*1000000/hours).toFixed(2):null,TRIR:hours?(recordable*200000/hours).toFixed(2):null,SR:hours?(lostDays*1000000/hours).toFixed(2):null,openCapa:capa.filter(c=>!closed(c)).length,overdueCapa:overdue,openInvestigation:inv.filter(i=>!/đã phê duyệt|approved|closed|hoàn tất/i.test(String(i.Status||''))).length},charts:{monthly,department:this.map(dept),cause:this.map(cause),severity:this.map(severity)}});
 },
 map:function(o){return{labels:Object.keys(o),data:Object.values(o)};},
 getPublicStats:function(payload){
  payload=payload||{};const year=Math.max(2000,Math.min(2100,Number(payload.year||new Date().getFullYear())));
  const count=(sheet,fields)=>Utils.getSheetData(sheet).filter(r=>fields.some(k=>ehsYear_(r[k])===year));
  const incidents=count(CONFIG.SHEETS.ACCIDENT,['IncidentDate']),near=count(CONFIG.SHEETS.NEAR_MISS,['EventDate']),ua=count(CONFIG.SHEETS.UNSAFE_ACT,['EventDate']),uc=count(CONFIG.SHEETS.UNSAFE_CONDITION,['EventDate']),ins=count(CONFIG.SHEETS.INSPECTION,['InspectionDate']),tr=count(CONFIG.SHEETS.TRAINING,['TrainingDate']),risk=count(CONFIG.SHEETS.RISK_ASSESSMENT,['AssessmentDate']);
  const capa=Utils.getSheetData(CONFIG.SHEETS.CAPA).filter(x=>['CompletedDate','CreatedDate','DueDate'].some(k=>ehsYear_(x[k])===year)),closed=capa.filter(x=>/đã đóng|closed|verified|hoàn tất|completed/i.test(String(x.Status||''))).length;
  const hours=Utils.getSheetData(CONFIG.SHEETS.WORKING_HOURS).filter(x=>Number(x.Year)===year).reduce((n,x)=>n+Number(x.Hours||0),0),monthly=Array(12).fill(0);incidents.forEach(x=>{const d=ehsParseDate_(x.IncidentDate);if(d)monthly[d.getMonth()]++;});
  return Utils.ok({year,public:true,kpi:{incident:incidents.length,nearMiss:near.length,unsafeAct:ua.length,unsafeCondition:uc.length,capaClosed:closed,capaTotal:capa.length,inspection:ins.length,training:tr.length,riskAssessment:risk.length,trainingAttendees:tr.reduce((n,x)=>n+Number(x.AttendeeCount||0),0),workingHours:hours},charts:{monthly}});
 }
};
