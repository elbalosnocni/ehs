const API={
  async post(action,data={}){const payload=typeof action==='object'?action:Object.assign({action},data);const user=JSON.parse(localStorage.getItem('ehs_user')||'null');if(user?.token&&!payload.token)payload.token=user.token;try{const r=await fetch(CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});const j=await r.json();if(j.code==='SESSION_EXPIRED'){localStorage.removeItem('ehs_user');location.href='login.html';}return j;}catch(e){console.error(e);return{status:'error',message:'Không kết nối được máy chủ EHS.'};}},
  async get(action,params={}){return this.post(action,params)}
};
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtDate=v=>{if(!v)return'';const d=new Date(v);return isNaN(d)?esc(v):d.toLocaleString('vi-VN',{hour12:false});};
const toast=(msg,type='info')=>{const el=document.getElementById('toast');if(!el)return;el.className='fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl text-sm font-semibold '+(type==='error'?'bg-red-600 text-white':type==='success'?'bg-emerald-600 text-white':'bg-slate-900 text-white');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),3500)};
