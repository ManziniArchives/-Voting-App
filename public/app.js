let user = null;
const qs = (sel)=> document.querySelector(sel);
const ce = (tag)=> document.createElement(tag);

// ---------- auth ----------
async function checkAuth() {
  user = await (await fetch('/auth/me', {credentials:'include'})).json();
  renderAuth();
}
checkAuth();

function renderAuth() {
  const authed = !!user;
  ['login','register'].forEach(id=> qs('#'+id).style.display = authed?'none':'block');
  qs('#logout').style.display  = authed?'inline':'none';
  qs('#create').style.display  = authed?'block':'none';
}

qs('#login').onsubmit = async (e)=>{
  e.preventDefault();
  await api('POST','/auth/login',{username:qs('#luser').value, password:qs('#lpass').value});
  checkAuth();
};
qs('#register').onsubmit = async (e)=>{
  e.preventDefault();
  await api('POST','/auth/register',{username:qs('#ruser').value, password:qs('#rpass').value});
  checkAuth();
};
qs('#logout').onclick = async ()=> { await api('POST','/auth/logout'); user=null; renderAuth(); };

// ---------- CRUD ----------
async function loadPolls() {
  const polls = await api('GET','/api/polls');
  qs('#polls').innerHTML='';
  polls.forEach(renderPoll);
}
loadPolls();

function renderPoll(p) {
  const div = ce('div'); div.className='poll';
  div.innerHTML = `<h3>${p.title}</h3>`;

  const canvas = ce('canvas');
  div.appendChild(canvas);

  // vote form
  const sel = ce('select');
  p.options.forEach(opt=>{
    const o = ce('option'); o.value=opt._id; o.textContent=opt.text;
    sel.appendChild(o);
  });
  const voteBtn = ce('button'); voteBtn.textContent='Vote';
  voteBtn.onclick = async ()=>{
    await api('POST',`/api/polls/${p._id}/vote`, {optionId:sel.value});
    loadPolls();
  };
  div.append(sel, voteBtn);

  // add option (auth only)
  if (user) {
    const newOpt = ce('input'); newOpt.placeholder='New option';
    const addBtn = ce('button'); addBtn.textContent='Add option';
    addBtn.onclick = async ()=>{
      await api('POST',`/api/polls/${p._id}/options`, {text:newOpt.value});
      loadPolls();
    };
    div.append(ce('br'), newOpt, addBtn);
  }

  // delete (owner only)
  if (user && p.author._id==user._id) {
    const del = ce('button'); del.textContent='Delete';
    del.onclick = async ()=> { await api('DELETE',`/api/polls/${p._id}`); loadPolls(); };
    div.append(del);
  }

  qs('#polls').appendChild(div);

  // Chart.js pie chart
  new Chart(canvas, {
    type:'pie',
    data:{
      labels:p.options.map(o=>o.text),
      datasets:[{data:p.options.map(o=>o.votes), backgroundColor:['#f43','#38f','#3c3','#fb1','#c5f']}]
    },
    options:{ responsive:false, plugins:{ legend:{ display:false } } }
  });
}

// ---------- helpers ----------
function addOption() {
  const inp = ce('input'); inp.className='opt'; inp.placeholder='Option';
  qs('#opts').appendChild(inp);
}
async function createPoll() {
  const title = qs('#title').value;
  const opts  = [...qs('#opts').querySelectorAll('input')].map(i=>i.value).filter(Boolean);
  await api('POST','/api/polls',{title, options:opts});
  loadPolls();
}
async function api(method,url,body) {
  const res = await fetch(url, {
    method,
    headers: body? {'Content-Type':'application/json'}:{},
    body: body? JSON.stringify(body):undefined,
    credentials:'include'
  });
  if (!res.ok) throw await res.text();
  return res.status===204? null : res.json();
}