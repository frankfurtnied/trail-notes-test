// Isolated Trail Notes TEST app shell. No private data or API responses are cached.
const CACHE_PREFIX = 'trail-notes-cloud-test-v4-';
const CACHE_NAME = CACHE_PREFIX + 'shell-1';
const APP_FILES = ['./', './index.html', './trail-notes-manifest.json',
 './trail-notes-icon-192.png', './trail-notes-icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
   const cache=await caches.open(CACHE_NAME);
   await cache.addAll(APP_FILES);
   await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
   const keys=await caches.keys();
   await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME)
     .map(k=>caches.delete(k)));
   await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 const isPage=req.mode==='navigate';
 const isShell=APP_FILES.some(p=>new URL(p,self.registration.scope).pathname===url.pathname);
 if(!isPage&&!isShell)return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   try{
     const res=await fetch(req);
     if(res.ok&&res.type!=='opaque')await cache.put(req,res.clone());
     return res;
   }catch(e){
     return await cache.match(req)||(isPage?await cache.match('./index.html'):undefined)||Response.error();
   }
 })());
});
