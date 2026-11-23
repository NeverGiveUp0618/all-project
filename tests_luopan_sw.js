const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={},cached=new Map(),deleted=[];let online=false,claimed=false;
const current=/const CACHE = '([^']+)'/.exec(fs.readFileSync('sw.js','utf8'))[1];
const key=x=>typeof x==='string'?x:x.url.replace('https://example.test/all-project/','./');
const cache={addAll:async urls=>{for(const u of urls){assert(fs.existsSync(u==='./'?'index.html':u.slice(2)),u);cached.set(u,{url:u})}},put:async(r,v)=>cached.set(key(r),v)};
const ctx={self:{addEventListener:(e,f)=>handlers[e]=f,skipWaiting:async()=>{},clients:{claim:async()=>claimed=true}},caches:{open:async()=>cache,keys:async()=>['mingli-home-v46-bookorder',current,'zeri-v35-question-bank','notes-v1'],delete:async k=>deleted.push(k),match:async r=>cached.get(key(r))},fetch:async r=>{if(!online)throw Error('offline');return {ok:true,url:key(r),clone(){return this}}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
const lifecycle=async e=>{let p;handlers[e]({waitUntil:r=>p=r});await p};
async function get(file){let p;handlers.fetch({request:{method:'GET',url:'https://example.test/all-project/'+file},respondWith:x=>p=x});return p}
(async()=>{
 await lifecycle('install');
 for(const f of ['index.html','app.js','model.js','data.js','plate-data.js','dial.js','style.css'])assert(cached.has('./luopan/'+f));
 assert(!cached.has('./luopan/reference.js')&&!cached.has('./luopan/reference/wide.jpg'));
 console.log('✓ 离线预缓存矢量绘图脚本、样式与教学内容');
 assert(cached.has('./notes.js')&&cached.has('./reader.js')&&cached.has('./guard.js'));
 console.log('✓ 全科笔记、阅读设置和进度保护均预缓存');
 await lifecycle('activate');assert(claimed);assert.deepEqual(deleted,['mingli-home-v46-bookorder']);
 console.log('✓ 更新只清导航旧缓存，保留其他站点与笔记缓存');
 for(const f of ['luopan/','luopan/model.js','luopan/app.js'])assert((await get(f)).url);
 console.log('✓ 断网可开罗盘、继续练习并重绘矢量盘面');
 online=true;assert.equal((await get('luopan/app.js')).url,'./luopan/app.js');online=false;assert.equal((await get('luopan/app.js')).url,'./luopan/app.js');
 console.log('✓ 在线更新与离线回退保持同一份脚本');
 console.log('通过 5 项罗盘离线与跨站缓存检查');
})().catch(e=>{console.error(e);process.exitCode=1});
