
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth, signInAnonymously, signInWithEmailAndPassword, signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,collection,onSnapshot,getDoc,setDoc,updateDoc,writeBatch,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js?v=2';

const form=document.querySelector('#access'), game=document.querySelector('main'), status=document.querySelector('#connection'), panel=document.querySelector('#teacher');
const byId=id=>document.getElementById(id);
const say=t=>{status.textContent=t};
const id=()=>crypto.randomUUID().replaceAll('-','');
let mode='', stops=[]; const drafts=new Map();
function clear(){stops.forEach(stop=>stop());stops=[]}
function button(text,fn,where){const b=document.createElement('button');b.textContent=text;b.onclick=()=>attempt(fn);where.append(b);return b}
async function attempt(fn){try{await fn()}catch(e){say('Error · '+e.message)}}
if(!firebaseConfig.projectId){say('Falta configurar Firebase. Consulta CONFIGURACION.md.')}
else {
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const watch=(ref,callback)=>stops.push(onSnapshot(ref,callback,e=>say('Error de sincronización · '+e.message)));
const error=e=>say('Error de guardado · '+e.message);
async function enterTeam(sessionId,teamId){
 await auth.authStateReady();
 if(auth.currentUser&&!auth.currentUser.isAnonymous)await signOut(auth);
 const user=auth.currentUser||(await signInAnonymously(auth)).user;
 const session=doc(db,'sessions',sessionId), team=doc(session,'teams',teamId);
 const result=await runTransaction(db,async tx=>{
  const snap=await tx.get(team);
  if(!snap.exists())throw Error('El enlace no corresponde a un equipo');
  const data=snap.data();
  if(!data.editor)tx.update(team,{editor:user.uid});
  else if(data.editor!==user.uid)throw Error('Este equipo ya tiene portavoz. Usa su navegador o pide a la docente que libere el acceso.');
  return data;
 });
 mode='team';form.hidden=true;game.hidden=false;
 window.cityTeam.load(result.work);
 say(result.name+' · conectado');
 window.cityTeam.save=patch=>{
  const fields=Object.fromEntries(Object.entries(patch).map(([k,v])=>['work.'+k,v]));
  return updateDoc(team,{...fields,updated:serverTimestamp()}).then(()=>say(result.name+' · guardado'),error);
 };
 watch(session,snap=>{if(snap.exists())window.cityTeam.stage(snap.data())}); watch(team,snap=>{if(snap.exists())window.cityTeam.feedback(snap.data().feedback)});
}

function feedbackForm(team,where){
 const form=document.createElement('form'), target=document.createElement('select'), kind=document.createElement('select'), message=document.createElement('textarea'), current=document.createElement('p');
 const prompts=['Festival','Lluvia','Mobiliario','Mezcla de residuos','Sorpresa final','Parte general'];
 const keys=['0','1','2','3','final','general'];
 for(let i=0;i<keys.length;i++)target.add(new Option(prompts[i],keys[i]));
 for(const k of ['Revisar','Correcto','Pregunta'])kind.add(new Option(k,k));
 const reaction=document.createElement('select'), score=document.createElement('select');
 reaction.setAttribute('aria-label','Reacción docente');score.setAttribute('aria-label','Puntos de la respuesta');
 for(const [icon,label] of [['','Sin reacción'],['👏','Bien razonado'],['🎯','Respuesta acertada'],['💡','Buena idea'],['🔍','Revisad la evidencia'],['💪','Seguid intentándolo']])reaction.add(new Option(icon?icon+' '+label:label,icon));
 for(const [value,label] of [['','Pendiente de puntuar'],['0','0 · Aún sin aciertos'],['1','1 · Identifica el cambio'],['2','2 · También lo justifica'],['3','3 · Además señala qué comprobar']])score.add(new Option(label,value));
 const draft=drafts.get(team.id)||{};
 target.value=draft.target||'0';
 function loadFeedback(){
  const old=team.data().feedback?.[target.value];
  kind.value=old?.kind||'Revisar';message.value=old?.message||'';
  reaction.value=old?.reaction||'';score.value=String(old?.score??'');
  score.disabled=target.value==='general';
 }
 loadFeedback();
 if(draft.target){kind.value=draft.kind;message.value=draft.message;reaction.value=draft.reaction;score.value=draft.score}
 target.onchange=()=>{loadFeedback();sync()};
 target.setAttribute('aria-label','Respuesta que quieres comentar');kind.setAttribute('aria-label','Tipo de feedback');
 message.setAttribute('aria-label','Feedback para el equipo');message.placeholder='Indica qué revisar y da una pista';message.maxLength=1200;
 const sync=()=>{
  drafts.set(team.id,{target:target.value,kind:kind.value,message:message.value,reaction:reaction.value,score:score.value});
  const old=team.data().feedback?.[target.value];
  current.textContent=old?'Último feedback · '+old.kind+' · '+old.message:'';
 };
 form.oninput=sync;form.append(target,kind,reaction,score,message,current);
 const send=document.createElement('button');send.textContent='Enviar feedback';form.append(send);
 form.onsubmit=e=>{e.preventDefault();attempt(async()=>{
  const text=message.value.trim();
  if(!text&&!reaction.value&&(score.disabled||score.value===''))throw Error('Añade un comentario, una reacción o una puntuación');
  const pending={target:target.value,kind:kind.value,message:text,reaction:reaction.value,score:score.disabled?'':score.value}; drafts.delete(team.id); try { await updateDoc(team.ref,{['feedback.'+pending.target]:{kind:pending.kind,message:text,reaction:pending.reaction,score:pending.score===''?null:Number(pending.score)}}); } catch(e){ drafts.set(team.id,pending); throw e; }
  message.value='';drafts.delete(team.id);
 })};
 sync();where.append(form);
}

function openTeacher(sessionId){
 clear();panel.replaceChildren();panel.hidden=false;
 const session=doc(db,'sessions',sessionId), teams=collection(session,'teams');
 const heading=document.createElement('h2');heading.textContent='Seguimiento de la sesión';panel.append(heading);
 const controls=document.createElement('div');controls.className='row';panel.append(controls);
 const list=document.createElement('div');list.className='team-grid';panel.append(list);
 watch(session,snap=>{
  if(!snap.exists()){say('Sesión inexistente');return}
  const data=snap.data();say(data.title+' · '+sessionId);
  controls.replaceChildren();
  window.cityTeam.phases.forEach((phase,i)=>{
   const b=button(phase,()=>updateDoc(session,{phase:i}),controls);
   b.setAttribute('aria-pressed',i===data.phase);
  });
  if(data.phase===1&&data.revealed<4)button('Revelar imprevisto '+(data.revealed+1),()=>updateDoc(session,{revealed:data.revealed+1}),controls);
  if(data.phase===4&&!data.surprise)button('Revelar sorpresa',()=>updateDoc(session,{surprise:true}),controls);
 });
 watch(teams,snap=>{
  if(list.contains(document.activeElement) && ['TEXTAREA','SELECT'].includes(document.activeElement.tagName)){ for(const card of list.children){const doc=snap.docs.find(d=>d.id===card.dataset.team);if(doc)card.querySelector('pre').textContent=window.cityTeam.summary(doc.data().work,doc.data().feedback).join('\n')} list.onfocusout=()=>setTimeout(()=>{if(!list.contains(document.activeElement)) paint()},0);return; } paint(); function paint(){ list.onfocusout=null;
  list.replaceChildren();
  snap.docs.sort((a,b)=>a.data().name.localeCompare(b.data().name,'es',{numeric:true})).forEach(d=>{
   const t=d.data(),w=t.work,box=document.createElement('article'),head=document.createElement('h3');
   box.dataset.team=d.id;
   head.textContent=t.name+' · '+Object.values(w.responses||{}).filter(v=>v.trim()).length+' respuestas · '+(t.editor?'portavoz asignado':'pendiente');
   box.append(head);
   const url=new URL(location.href);url.search='';url.searchParams.set('session',sessionId);url.searchParams.set('team',d.id);
   const link=document.createElement('a');link.href=url;link.textContent='Enlace de acceso de '+t.name;link.target='_blank';link.rel='noopener';box.append(link);
   button('Copiar enlace',()=>navigator.clipboard.writeText(url.href).then(()=>say('Enlace copiado · '+t.name)),box);
   if(t.editor)button('Liberar portavoz',()=>{if(confirm('¿Permitir que otro navegador asuma este equipo?'))return updateDoc(d.ref,{editor:null})},box);
   const output=document.createElement('pre');
   const lines=window.cityTeam.summary(w,t.feedback);
   output.textContent=lines.join('\n');box.append(output);feedbackForm(d,box);list.append(box);
  }); }
 });
}
byId('teacher-login').onsubmit=e=>{e.preventDefault();attempt(async()=>{
 await signInWithEmailAndPassword(auth,byId('email').value,byId('password').value);
 byId('password').value='';mode='teacher';byId('teacher-login').hidden=true;byId('teacher-session').hidden=false;say('Sesión docente iniciada');
})};
byId('teacher-session').onsubmit=e=>{e.preventDefault();attempt(async()=>{
 if(mode!=='teacher')return;
 const title=byId('session-title').value.trim(), count=Number(byId('team-count').value);
 if(!title||!Number.isInteger(count)||count<2||count>12)throw Error('Introduce un título y entre 2 y 12 equipos');
 const sessionId=id(),ref=doc(db,'sessions',sessionId),batch=writeBatch(db);
 batch.set(ref,{title,phase:0,revealed:0,surprise:false,created:serverTimestamp()});
 for(let i=1;i<=count;i++)batch.set(doc(ref,'teams',id()),{name:'Equipo '+i,editor:null,work:window.cityTeam.empty()});
 await batch.commit();byId('existing').value=sessionId;openTeacher(sessionId);
})};
byId('resume').onclick=()=>attempt(async()=>{
 const value=byId('existing').value.trim();
 if(!/^[a-f0-9]{32}$/.test(value))throw Error('Introduce el identificador de sesión');
 const snap=await getDoc(doc(db,'sessions',value));
 if(!snap.exists())throw Error('Sesión inexistente');
 openTeacher(value);
});
const args=new URLSearchParams(location.search);
if(args.has('session')&&args.has('team')){
 byId('teacher-login').hidden=true;
 const s=args.get('session'),t=args.get('team');
 if(/^[a-f0-9]{32}$/.test(s)&&/^[a-f0-9]{32}$/.test(t))attempt(()=>enterTeam(s,t));
 else say('Enlace de equipo incorrecto');
}
}





