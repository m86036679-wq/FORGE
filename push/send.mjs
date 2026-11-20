// Schickt abends die Tagesfazit-Benachrichtigung an FORGE (Web Push).
import webpush from 'web-push';
const KEY=process.env.FORGE_PUSH; if(!KEY){ console.log('FORGE_PUSH fehlt'); process.exit(0); }
const VAPID_PUBLIC='BNnNChteR7hmXXwA7FbwFwRtXI-3DsGinb1vKj47FtvEiyrY9HIf-EvC9VnNBCgc7FXk3WQAg4tEUPo9VJaoG6U';
const VAPID_PRIVATE='JhE_RDP7VtdyjSC7DzVmYSVA9YyNLJKM4VIGAjMWMMc';
const URLS=['https://kvs.ix.workers.dev/forge-sync-v1/','https://awesomekv.dev/forge-sync-v1/'];
const now=new Date(), berlin=new Date(now.toLocaleString('en-US',{timeZone:'Europe/Berlin'}));
const today=berlin.getFullYear()+'-'+String(berlin.getMonth()+1).padStart(2,'0')+'-'+String(berlin.getDate()).padStart(2,'0');
const mins=berlin.getHours()*60+berlin.getMinutes();
const force=process.env.FORCE==='1';
if(!force&&mins<21*60+15){ console.log('Noch zu früh',berlin.toTimeString()); process.exit(0); }
async function get(id){ for(const u of URLS){ try{ const r=await fetch(u+id); if(r.status===404) return null; if(r.ok) return await r.text(); }catch(e){} } throw new Error('KV nicht erreichbar'); }
async function put(id,body){ for(const u of URLS){ try{ const r=await fetch(u+id,{method:'PUT',body}); if(r.ok) return; }catch(e){} } }
const raw=await get(KEY); if(!raw){ console.log('Keine Anmeldung gefunden'); process.exit(0); }
const st=JSON.parse(raw); if(!st.sub){ console.log('Kein Abo'); process.exit(0); }
if(!force&&st.sent===today){ console.log('Heute schon gesendet'); process.exit(0); }
const f=st.date===today&&st.score!=null?st:null;
const body=f?`${f.score}/100 · ${f.grade}${f.tip?' – '+f.tip:''}`:'Heute noch nichts eingetragen – trag dein Essen ein und sieh dein Fazit.';
webpush.setVapidDetails('mailto:forge@example.com',VAPID_PUBLIC,VAPID_PRIVATE);
try{ await webpush.sendNotification(st.sub,JSON.stringify({title:'FORGE · Tagesfazit',body,url:'./#fazit'}),{TTL:3*3600}); console.log('Gesendet:',body); }
catch(e){ console.log('Fehler',e.statusCode,e.body); if(e.statusCode===404||e.statusCode===410){ st.sub=null; } }
st.sent=today; await put(KEY,JSON.stringify(st));
