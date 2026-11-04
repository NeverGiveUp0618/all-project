// guard.js 真跑：第一次页面写进度并镜像；第二次页面 localStorage 被清空（模拟微信清缓存但 IndexedDB 还在）→ 应自动补回
const {JSDOM}=require('jsdom'),fs=require('fs');
const src=fs.readFileSync(__dirname+'/guard.js','utf8');
const BACK=new Map();                                   // 跨「页面」共享的假 IndexedDB
function mockIDB(){return{open(){const r={};setTimeout(()=>{const db={createObjectStore(){},transaction(){const tx={objectStore(){return{
  get(k){const q={};setTimeout(()=>q.onsuccess&&q.onsuccess(),0);Object.defineProperty(q,'result',{get:()=>BACK.get(k)});return q;},
  put(v,k){BACK.set(k,JSON.parse(JSON.stringify(v)));setTimeout(()=>tx.oncomplete&&tx.oncomplete(),0);}};}};return tx;}};
  r.result=db;if(!BACK.has('_init')){BACK.set('_init',1);r.onupgradeneeded&&r.onupgradeneeded();}r.onsuccess&&r.onsuccess();},0);return r;}};}
function page(pre){const d=new JSDOM('<body></body>',{url:'https://nevergiveup0618.github.io/all-project/',runScripts:'outside-only'});
  const w=d.window;w.indexedDB=mockIDB();Object.defineProperty(w.navigator,'storage',{value:{persist:()=>Promise.resolve(true)}});
  for(const k in pre)w.localStorage.setItem(k,pre[k]);w.eval(src);return w;}
let ok=0,bad=0;const t=(n,c)=>{c?ok++:bad++;console.log((c?'  ✓ ':'  ✗ ')+n)};
(async()=>{
  const a=page({bazi:'{"totalCorrect":4000}',bazi_cat_stats:'{"x":1}',yst_stat_bazi:'缓存',wst_last:'bazi'});
  await a.YG.ready;await a.YG.snapshot();
  const snap=BACK.get('latest');
  t('镜像写进了学习进度',snap&&snap.data.bazi.includes('4000')&&snap.data.bazi_cat_stats);
  t('缓存类键不进镜像',!('yst_stat_bazi' in snap.data)&&!('wst_last' in snap.data));
  const b=page({});                                      // 被清空后的新页面
  const n=await b.YG.ready;
  t('localStorage 被清空后自动补回 2 项',n===2&&b.localStorage.getItem('bazi').includes('4000'));
  const c=page({bazi:'{"totalCorrect":4001}'});          // 现有数据不能被镜像旧值覆盖
  await c.YG.ready;
  t('已有的键不被旧镜像覆盖',c.localStorage.getItem('bazi').includes('4001')&&c.localStorage.getItem('bazi_cat_stats'));
  await c.YG.snapshot();
  const d=page({});await d.YG.ready;
  t('镜像随新数据更新（只增不减）',d.localStorage.getItem('bazi').includes('4001'));
  console.log(`\n${bad?'✗':'✓'} 通过 ${ok} 项，失败 ${bad} 项`);process.exit(bad?1:0);
})();
