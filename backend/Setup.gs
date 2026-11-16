function setupEHS(){
  Utils.setup();
  const settings=Utils.getSheetData(CONFIG.SHEETS.SETTING);
  const defaults=[
    {Key:'SYSTEM_VERSION',Value:CONFIG.VERSION,Description:'Phiên bản ứng dụng'},
    {Key:'SCOPE_MODE',Value:'MULTI',Description:'Một công ty, nhiều nhà máy và bộ phận'},
    {Key:'RETENTION_YEARS',Value:'10',Description:'Thời hạn lưu trữ tối thiểu; không tự xóa dữ liệu'},
    {Key:'DEPLOYMENT_MODE',Value:'HYBRID',Description:'GitHub Pages + Google Apps Script'}
  ];
  defaults.forEach(x=>{if(!settings.some(y=>String(y.Key)===x.Key))Utils.appendObject(CONFIG.SHEETS.SETTING,Object.assign(x,{UpdatedDate:new Date()}));});
  const users=Utils.getSheetData(CONFIG.SHEETS.USER);
  if(!users.length){const salt=Utils.randomToken().slice(0,16);Utils.appendObject(CONFIG.SHEETS.USER,{UserID:'U001',Username:'admin',PasswordHash:Utils.hash('Admin@123'+salt),PasswordSalt:salt,Password:'',Role:CONFIG.ROLES.ADMIN,Email:'',Status:'Active',FailedAttempts:0,LockedUntil:'',CreatedDate:new Date(),LastLogin:'',MustChangePassword:true,Plant:'',Department:''});Logger.log('Created admin / Admin@123 - change immediately.');}
  return 'EHS Manager '+CONFIG.VERSION+' setup completed. Existing records preserved.';
}
