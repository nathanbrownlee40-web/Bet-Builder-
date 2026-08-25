const CACHE='top-daily-builders-value-v19';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192x192.png','./icon-512x512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(APP_SHELL.map(u=>fetch(u,{cache:'no-store'}).then(r=>r.ok?c.put(u,r):null).catch(()=>null)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  const doc=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/sw.js')||u.pathname.endsWith('/manifest.json');
  if(doc){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&u.pathname.endsWith('/index.html')){const c=r.clone();caches.open(CACHE).then(x=>x.put('./index.html',c)).catch(()=>{});}return r;}).catch(()=>caches.match('./index.html').then(r=>r||new Response('Offline',{status:503}))));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{if(x.ok){const c=x.clone();caches.open(CACHE).then(y=>y.put(e.request,c)).catch(()=>{});}return x;})));
});
