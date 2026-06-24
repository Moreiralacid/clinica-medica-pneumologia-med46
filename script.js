
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const state = JSON.parse(localStorage.getItem('pneumoStats') || '{}');
const answeredSet = new Set(state.answered || []);
let correct = state.correct || 0;
let wrong = state.wrong || 0;

function saveStats(){localStorage.setItem('pneumoStats', JSON.stringify({answered:[...answeredSet], correct, wrong}));}
function updateStats(){const total=answeredSet.size; $('#answered').textContent=total; $('#correct').textContent=correct; $('#wrong').textContent=wrong; $('#score').textContent=total? Math.round((correct/total)*100)+'%':'0%';}
function showTab(id){$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id)); $$('.panel').forEach(p=>p.classList.toggle('active',p.id===id)); window.scrollTo({top:0,behavior:'smooth'});}
$$('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$$('[data-tab-target]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tabTarget)));

const themeBtn = $('#themeToggle');
function applyTheme(){const dark=localStorage.getItem('theme')==='dark'; document.body.classList.toggle('dark',dark); themeBtn.textContent = dark ? '☀️ Modo Claro' : '🌙 Modo Escuro';}
themeBtn.addEventListener('click',()=>{localStorage.setItem('theme', document.body.classList.contains('dark')?'light':'dark'); applyTheme();}); applyTheme();

const subjects=[...new Set(QUESTIONS.map(q=>q.assunto))].sort();
subjects.forEach(s=>{const o=document.createElement('option'); o.value=s; o.textContent=s; $('#subjectFilter').appendChild(o);});
const types=[...new Set(QUESTIONS.map(q=>q.tipo))].sort();
types.forEach(t=>{const o=document.createElement('option'); o.value=t; o.textContent=t; $('#typeFilter').appendChild(o);});

function renderQuestions(){
  const term=$('#search').value.toLowerCase(); const subj=$('#subjectFilter').value; const type=$('#typeFilter').value;
  const list=$('#questionList'); list.innerHTML='';
  const filtered=QUESTIONS.filter(q=>(!subj||q.assunto===subj)&&(!type||q.tipo===type)&&(!term||q.q.toLowerCase().includes(term)||q.assunto.toLowerCase().includes(term)));
  filtered.forEach((q,idx)=>{
    const realIndex=QUESTIONS.indexOf(q);
    const div=document.createElement('article'); div.className='question';
    const tempClass=q.temp==='Quente'?'hot':q.temp==='Morno'?'med':'';
    const diffClass=q.dif==='Difícil'?'dif':'';
    div.innerHTML=`<div class="qmeta"><span class="pill">${q.assunto}</span><span class="pill">${q.tipo}</span><span class="pill ${diffClass}">${q.dif}</span><span class="pill ${tempClass}">${q.temp}</span><span class="pill">${q.origem||'Material anexo'}</span></div><h4>Q${String(realIndex+1).padStart(2,'0')}. ${q.q}</h4>`;
    if(q.alts && q.alts.length){
      const alts=document.createElement('div'); alts.className='alts';
      q.alts.forEach((a,i)=>{const b=document.createElement('button'); b.className='alt'; b.textContent=String.fromCharCode(65+i)+') '+a; b.addEventListener('click',()=>answer(realIndex,i,div)); alts.appendChild(b);});
      div.appendChild(alts);
    } else {
      const box=document.createElement('div'); box.className='flow'; box.textContent='Questão discursiva: tente responder mentalmente antes de abrir o modelo.'; div.appendChild(box);
    }
    const btn=document.createElement('button'); btn.className='smallbtn'; btn.textContent='Mostrar resposta'; btn.addEventListener('click',()=>ans.classList.toggle('show'));
    const ans=document.createElement('div'); ans.className='answer';
    const gab=(q.alts&&q.alts.length)? String.fromCharCode(65+q.ans)+' — '+q.alts[q.ans] : q.ans;
    ans.innerHTML=`<b>Gabarito:</b> ${gab}<br><b>Comentário:</b> ${q.com}`;
    div.appendChild(btn); div.appendChild(ans); list.appendChild(div);
  });
  if(!filtered.length) list.innerHTML='<div class="notice">Nenhuma questão encontrada com esse filtro.</div>';
}
function answer(qi, ai, card){
  const q=QUESTIONS[qi]; const buttons=$$('.alt',card); buttons.forEach((b,i)=>{b.disabled=true; if(i===q.ans)b.classList.add('correct'); if(i===ai && i!==q.ans)b.classList.add('wrong');});
  if(!answeredSet.has(qi)){answeredSet.add(qi); if(ai===q.ans) correct++; else wrong++; saveStats(); updateStats();}
  $('.answer',card).classList.add('show');
}
['search','subjectFilter','typeFilter'].forEach(id=>$('#'+id).addEventListener('input',renderQuestions));
$('#resetStats').addEventListener('click',()=>{if(confirm('Zerar seu desempenho?')){answeredSet.clear();correct=0;wrong=0;saveStats();updateStats();renderQuestions();}});

function makePlan(){
  const h=Number($('#hoursDay').value||3), d=Number($('#daysWeek').value||6); const weekly=h*d;
  const topics=[
    ['Asma: GINA, ACT, MART e crise','Teoria + questões',3],['DPOC: GOLD A/B/E e espirometria','Teoria + questões',3],['DPOC: ODP, VNI e exacerbação','Questões + algoritmo',2],['Tuberculose: diagnóstico e RHZE','Teoria + questões',3],['TB: contatos, ILTB e efeitos adversos','Discursivas + revisão',2],['PAC: CURB-65, RX, antibiótico','Questões + casos',3],['Derrame/Bronquiectasias essenciais','Revisão rápida',1.5],['Simulado final + correção dos erros','Simulado',2]
  ];
  const out=$('#planOutput'); out.innerHTML=''; let day=1;
  topics.forEach(t=>{const div=document.createElement('div'); div.className='plan-card'; div.innerHTML=`<h3>D${day} — ${t[0]}</h3><p><b>Carga:</b> ${t[2]}h · <b>Atividade:</b> ${t[1]}</p><p><b>Proporção:</b> 30% teoria · 50% questões · 20% revisão ativa</p><p><b>Revisões:</b> D+1, D+3, D+7 e D+15.</p>`; out.appendChild(div); day++;});
  const warn=document.createElement('div'); warn.className='notice'; warn.innerHTML=`Com ${weekly}h/semana, priorize 2 ciclos por semana: <b>Asma/DPOC</b> e <b>TB/PAC</b>. Se a PF estiver em menos de 7 dias, pule baixa prioridade e faça só banco de questões + discursivas.`; out.prepend(warn);
}
$('#makePlan').addEventListener('click',makePlan);

window.addEventListener('scroll',()=>{$('#topBtn').style.display=scrollY>500?'block':'none';}); $('#topBtn').addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
updateStats(); renderQuestions(); makePlan();
