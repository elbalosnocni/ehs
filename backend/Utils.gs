const Utils = {
  ss: function(){ return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId()); },
  sheet: function(name){ return this.ss().getSheetByName(name); },
  responseJSON: function(data){ return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); },
  ok: function(data,msg){ return this.responseJSON(Object.assign({status:'success'}, data||{}, msg?{message:msg}:{})); },
  err: function(msg,code){ return this.responseJSON({status:'error',code:code||'ERROR',message:String(msg)}); },
  now: function(){ return new Date(); },
  iso: function(v){ if(!v) return ''; const d = v instanceof Date ? v : new Date(v); return isNaN(d.getTime()) ? String(v) : Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"); },
  date: function(v){ if(!v) return ''; const d=v instanceof Date?v:new Date(v); return isNaN(d.getTime())?'':Utilities.formatDate(d,CONFIG.TIMEZONE,'yyyy-MM-dd'); },
  ensureSheet: function(name, headers){
    const ss=this.ss(); let sh=ss.getSheetByName(name);
    if(!sh){ sh=ss.insertSheet(name); sh.getRange(1,1,1,headers.length).setValues([headers]); sh.setFrozenRows(1); return sh; }
    const lastCol=Math.max(sh.getLastColumn(),1); let current=sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
    if(current.length===1 && !current[0]) current=[];
    headers.forEach(h=>{ if(current.indexOf(h)<0){ current.push(h); sh.getRange(1,current.length).setValue(h); } });
    sh.setFrozenRows(1); return sh;
  },
  setup: function(){ Object.keys(CONFIG.HEADERS).forEach(k=>this.ensureSheet(CONFIG.SHEETS[k],CONFIG.HEADERS[k])); return 'OK'; },
  getSheetData: function(name){
    const sh=this.sheet(name); if(!sh || sh.getLastRow()<2) return [];
    const vals=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues();
    const headers=vals[0].map(v=>String(v).trim());
    return vals.slice(1).filter(r=>r.some(v=>v!=='' && v!==null)).map(r=>{const o={};headers.forEach((h,i)=>{if(h)o[h]=r[i];});return o;});
  },
  appendObject: function(name,obj){
    const sh=this.sheet(name); if(!sh) throw new Error('Sheet '+name+' chưa tồn tại');
    const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    sh.appendRow(headers.map(h=>obj[h]===undefined?'':obj[h]));
  },
  findRowById: function(name,id,idHeader){ const sh=this.sheet(name); if(!sh||sh.getLastRow()<2)return -1; const vals=sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getValues(); const idx=vals[0].map(String).indexOf(idHeader); if(idx<0)return -1; for(let i=1;i<vals.length;i++)if(String(vals[i][idx])===String(id))return i+1; return -1; },
  updateObject: function(name,id,idHeader,obj){ const sh=this.sheet(name); const row=this.findRowById(name,id,idHeader); if(row<2) throw new Error('Không tìm thấy '+id); const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); const old=sh.getRange(row,1,1,headers.length).getValues()[0]; const next=headers.map((h,i)=>obj[h]===undefined?old[i]:obj[h]); sh.getRange(row,1,1,headers.length).setValues([next]); return {old:old,new:next,headers:headers}; },
  generateId: function(prefix,sheetName,idHeader){ const year=new Date().getFullYear(); const sh=this.sheet(sheetName); let n=1; if(sh&&sh.getLastRow()>1){ const idx=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String).indexOf(idHeader); if(idx>=0){ const vals=sh.getRange(2,idx+1,sh.getLastRow()-1,1).getValues().flat(); n=vals.filter(v=>String(v).indexOf(prefix+'-'+year+'-')===0).length+1; } } return prefix+'-'+year+'-'+String(n).padStart(4,'0'); },
  sanitize: function(v){ return v===undefined||v===null?'':String(v).trim(); },
  parseBool: function(v){ return v===true||v==='true'||v===1||v==='1'||v==='YES'; },
  hash: function(text){ const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8); return Utilities.base64EncodeWebSafe(bytes); },
  randomToken: function(){ return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''); },
  writeAudit: function(ctx,action,module,recordId,oldValue,newValue,result,details){
    try{ this.appendObject(CONFIG.SHEETS.AUDIT_LOG,{LogID:'LOG-'+new Date().getTime()+'-'+Math.floor(Math.random()*1000),Timestamp:new Date(),UserID:ctx?.userId||'SYSTEM',Username:ctx?.username||'SYSTEM',Role:ctx?.role||'',Action:action,Module:module||'',RecordID:recordId||'',OldValue:oldValue?JSON.stringify(oldValue):'',NewValue:newValue?JSON.stringify(newValue):'',Result:result||'SUCCESS',Details:details||''}); }catch(e){}
  },
  writeLog: function(userId,action,details){ try{this.appendObject(CONFIG.SHEETS.LOG,{LogID:'LOG-'+new Date().getTime(),UserID:userId||'SYSTEM',Action:action,Timestamp:new Date(),Details:JSON.stringify(details||{})});}catch(e){} },
  getDriveRoot: function(){ const id=CONFIG.DRIVE_FOLDER_ID; if(id){try{return DriveApp.getFolderById(id);}catch(e){}} return DriveApp.createFolder('EHS Manager Evidence'); },
  saveFiles: function(recordId,recordType,files,user){ if(!files||!files.length)return []; const root=this.getDriveRoot(); const folderIt=root.getFoldersByName(recordType+'_'+recordId); const folder=folderIt.hasNext()?folderIt.next():root.createFolder(recordType+'_'+recordId); const out=[]; files.forEach(f=>{if(!f||!f.base64)return; const blob=Utilities.newBlob(Utilities.base64Decode(f.base64),f.mimeType||'application/octet-stream',f.fileName||('file-'+Date.now())); const file=folder.createFile(blob); const fileId='FILE-'+Date.now()+'-'+Math.floor(Math.random()*10000); const obj={FileID:fileId,RecordID:recordId,RecordType:recordType,FileName:file.getName(),MimeType:file.getMimeType(),DriveFileId:file.getId(),DriveUrl:file.getUrl(),UploadedBy:user?.userId||'SYSTEM',UploadedDate:new Date(),Description:f.description||''}; this.appendObject(CONFIG.SHEETS.ACCIDENT_ATTACHMENT,obj); out.push(obj);}); return out; },
  listFiles: function(recordId){ return this.getSheetData(CONFIG.SHEETS.ACCIDENT_ATTACHMENT).filter(x=>String(x.RecordID)===String(recordId)); },
  getSession: function(token){ if(!token)return null; const p=PropertiesService.getScriptProperties(); const raw=p.getProperty('SESSION_'+token); if(!raw)return null; try{const s=JSON.parse(raw); if(new Date(s.expiresAt).getTime()<Date.now()){p.deleteProperty('SESSION_'+token);return null;} return s;}catch(e){return null;} },
  setSession: function(session){ const token=session.token; PropertiesService.getScriptProperties().setProperty('SESSION_'+token,JSON.stringify(session)); return token; },
  deleteSession: function(token){ if(token)PropertiesService.getScriptProperties().deleteProperty('SESSION_'+token); },
  requireAuth: function(token,roles){ const s=this.getSession(token); if(!s)throw new Error('SESSION_EXPIRED'); if(roles&&roles.length&&roles.indexOf(s.role)<0)throw new Error('FORBIDDEN'); return s; },
  safeRows: function(rows){ return (rows||[]).map(r=>{const o={};Object.keys(r).forEach(k=>{const v=r[k];o[k]=v instanceof Date?this.iso(v):v;});return o;}); }
};
