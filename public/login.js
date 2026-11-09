import { request } from './booking-api.js';

const status=document.querySelector('#login-status');
const panel=document.querySelector('#profile-panel');
const form=document.querySelector('#profile-form');
const signin=document.querySelector('#signin');
const actions=document.querySelector('#login-actions');
const query=new URLSearchParams(location.search);
const after=query.get('volver');
const event=query.get('evento');
const seat=Number(query.get('mesa'));
const selection=after==='mapa' && ['viernes','sabado'].includes(event) && Number.isInteger(seat) && seat>=1 && seat<=84;
const nextQuery=new URLSearchParams();
if(['mapa','reservas'].includes(after)) nextQuery.set('volver',after);
if(selection){nextQuery.set('evento',event);nextQuery.set('mesa',seat);}
const current='/login.html'+(nextQuery.size?'?'+nextQuery:'');
const next=document.querySelector('#account-next');
next.href=after==='reservas'?'/mis-reservas.html':selection?'/?'+new URLSearchParams({evento:event,mesa:seat})+'#mapa':'/#mapa';
next.textContent=after==='reservas'?'Volver a Mis reservas':selection?'Volver a la mesa '+seat:'Ir al mapa';
signin.href='/signin-with-chatgpt?return_to='+encodeURIComponent(current);
form.elements.birth.max=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

function show(profile,email,blocked){
  panel.hidden=false;
  for(const key of ['name','surname','ci','birth']) form.elements[key].value=profile?.[key] || '';
  form.elements.email.value=profile?.email || email;
  document.querySelector('#profile-id').textContent=profile?'ID de cliente: '+profile.id:'Tu ID se asigna al guardar el perfil.';
  form.querySelector('button').disabled=blocked;
  status.textContent=blocked?'Tu cuenta está bloqueada para nuevas reservas.':profile?'Tu perfil está listo para reservar.':'Completa tus datos para solicitar una mesa.';
}

async function open(){
  try {
    const {role}=await request('/api/sesion');
    if(role==='admin'){
      location.replace('/admin');
    } else if(role==='anonymous'){
      status.textContent='Inicia sesión con tu cuenta de ChatGPT para guardar tu perfil y reservar un lounge.';
      actions.hidden=false;
    } else {
      const {profile,email,blocked}=await request('/api/perfil');
      show(profile,email,blocked);
    }
  } catch(err) {status.textContent=err.message;}
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=event.submitter;
  button.disabled=true;
  const {name,surname,ci,birth}=Object.fromEntries(new FormData(form));
  try {
    const {profile}=await request('/api/perfil',{name,surname,ci,birth});
    show(profile,profile.email,false);
    status.textContent='Perfil guardado. Ya puedes elegir una mesa en el mapa.';
    next.focus();
  } catch(err){status.textContent=err.message;}
  finally{button.disabled=false;}
});
open();
