const Auth = {
  login:function(payload){
    Utils.setup();
    const username=Utils.sanitize(payload.username); const password=String(payload.password||'');
    if(!username||!password)return Utils.err('Vui lòng nhập tên đăng nhập và mật khẩu.','BAD_REQUEST');
    const users=Utils.getSheetData(CONFIG.SHEETS.USER); const idx=users.findIndex(u=>String(u.Username).toLowerCase()===username.toLowerCase());
    if(idx<0)return Utils.err('Tên đăng nhập hoặc mật khẩu không chính xác.','AUTH_FAILED');
    const user=users[idx];
    if(String(user.Status||'Active')!=='Active')return Utils.err('Tài khoản đang bị khóa hoặc không hoạt động.','ACCOUNT_LOCKED');
    if(user.LockedUntil && new Date(user.LockedUntil).getTime()>Date.now())return Utils.err('Tài khoản đang bị khóa tạm thời.','ACCOUNT_LOCKED');
    let valid=false; const salt=String(user.PasswordSalt||'');
    if(user.PasswordHash) valid=Utils.hash(password+salt)===String(user.PasswordHash);
    else if(user.Password) valid=String(user.Password)===password; // migrate old plaintext account
    if(!valid){
      const attempts=Number(user.FailedAttempts||0)+1; const row=Utils.findRowById(CONFIG.SHEETS.USER,user.UserID,'UserID'); const sh=Utils.sheet(CONFIG.SHEETS.USER); const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); const set={FailedAttempts:attempts}; if(attempts>=CONFIG.MAX_LOGIN_ATTEMPTS)set.LockedUntil=new Date(Date.now()+CONFIG.LOCK_MINUTES*60000); Utils.updateObject(CONFIG.SHEETS.USER,user.UserID,'UserID',set); Utils.writeAudit({userId:user.UserID,username:user.Username,role:user.Role},'LOGIN_FAILED','AUTH',user.UserID,null,null,'FAIL','Failed login '+attempts); return Utils.err(attempts>=CONFIG.MAX_LOGIN_ATTEMPTS?'Tài khoản bị khóa tạm thời do đăng nhập sai quá số lần cho phép.':'Tên đăng nhập hoặc mật khẩu không chính xác.','AUTH_FAILED');
    }
    if(!user.PasswordHash){ const newSalt=Utils.randomToken().slice(0,16); Utils.updateObject(CONFIG.SHEETS.USER,user.UserID,'UserID',{PasswordSalt:newSalt,PasswordHash:Utils.hash(password+newSalt),Password:'',FailedAttempts:0,LockedUntil:'',LastLogin:new Date(),MustChangePassword:true}); }
    else Utils.updateObject(CONFIG.SHEETS.USER,user.UserID,'UserID',{FailedAttempts:0,LockedUntil:'',LastLogin:new Date()});
    const token=Utils.randomToken(); const session={token,userId:String(user.UserID),username:String(user.Username),role:String(user.Role||CONFIG.ROLES.VIEWER),email:String(user.Email||''),expiresAt:new Date(Date.now()+CONFIG.SESSION_HOURS*3600000).toISOString()}; Utils.setSession(session); Utils.writeAudit(session,'LOGIN','AUTH',session.userId,null,null,'SUCCESS','');
    return Utils.ok({token:token,user:{userId:session.userId,username:session.username,role:session.role,email:session.email,expiresAt:session.expiresAt}});
  },
  logout:function(payload){ const s=Utils.getSession(payload.token); if(s)Utils.writeAudit(s,'LOGOUT','AUTH',s.userId,null,null,'SUCCESS',''); Utils.deleteSession(payload.token); return Utils.ok({},'Đã đăng xuất.'); },
  me:function(payload){ const s=Utils.requireAuth(payload.token); return Utils.ok({user:s}); },
  changePassword:function(payload){ const s=Utils.requireAuth(payload.token); const old=String(payload.oldPassword||''), next=String(payload.newPassword||''); if(next.length<8)throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự.'); const user=Utils.getSheetData(CONFIG.SHEETS.USER).find(u=>String(u.UserID)===s.userId); if(!user)throw new Error('Không tìm thấy tài khoản.'); if(Utils.hash(old+String(user.PasswordSalt||''))!==String(user.PasswordHash||''))throw new Error('Mật khẩu hiện tại không đúng.'); const salt=Utils.randomToken().slice(0,16); Utils.updateObject(CONFIG.SHEETS.USER,s.userId,'UserID',{PasswordSalt:salt,PasswordHash:Utils.hash(next+salt),Password:'',MustChangePassword:false}); Utils.writeAudit(s,'CHANGE_PASSWORD','AUTH',s.userId,null,null,'SUCCESS',''); return Utils.ok({},'Đổi mật khẩu thành công.'); },
  resetPassword:function(payload){ const s=Utils.requireAuth(payload.token,[CONFIG.ROLES.ADMIN]); const id=String(payload.userId||''); const temp=String(payload.newPassword||''); if(temp.length<8)throw new Error('Mật khẩu phải có ít nhất 8 ký tự.'); const salt=Utils.randomToken().slice(0,16); Utils.updateObject(CONFIG.SHEETS.USER,id,'UserID',{PasswordSalt:salt,PasswordHash:Utils.hash(temp+salt),Password:'',MustChangePassword:true,FailedAttempts:0,LockedUntil:'',Status:'Active'}); Utils.writeAudit(s,'RESET_PASSWORD','USER',id,null,null,'SUCCESS',''); return Utils.ok({},'Đã reset mật khẩu.'); },
  setLock:function(payload){ const s=Utils.requireAuth(payload.token,[CONFIG.ROLES.ADMIN]); const id=String(payload.userId||''); const lock=Utils.parseBool(payload.lock); Utils.updateObject(CONFIG.SHEETS.USER,id,'UserID',{Status:lock?'Locked':'Active',LockedUntil:lock?new Date(Date.now()+365*24*3600000):''}); Utils.writeAudit(s,lock?'LOCK_USER':'UNLOCK_USER','USER',id,null,null,'SUCCESS',''); return Utils.ok({},lock?'Đã khóa tài khoản.':'Đã mở tài khoản.'); },
  users:function(payload){ const s=Utils.requireAuth(payload.token,[CONFIG.ROLES.ADMIN]); const data=Utils.getSheetData(CONFIG.SHEETS.USER).map(u=>{const x=Object.assign({},u);delete x.Password;delete x.PasswordHash;delete x.PasswordSalt;return x;}); return Utils.ok({data:Utils.safeRows(data)}); }
};
