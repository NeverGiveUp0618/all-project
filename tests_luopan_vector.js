/* Rendering/interaction regressions: an enlarged screenshot is not a vector disk. */
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('../bazi-course/node_modules/jsdom');
const html=fs.readFileSync('luopan/index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/all-project/luopan/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,$=s=>w.document.querySelector(s);
const observers=[],NativeObserver=w.MutationObserver;w.MutationObserver=class extends NativeObserver{constructor(fn){super(fn);observers.push(this)}};
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const f of ['data.js','model.js','plate-data.js','dial.js','degree-memory.js','guides.js','app.js'])w.eval(fs.readFileSync('luopan/'+f,'utf8'));
assert(w.LuopanApp,'initialization');
assert(!$('#compass-svg image')&&!$('canvas'),'the entire board must be SVG text and geometry');
assert(!html.includes('reference.js'),'no screenshot compositor');
assert($('#compass-svg text').textContent,'actual vector labels, not an empty wrapper');
for(const l of w.LuopanApp.L.filter(l=>!l.logical)){const g=$(`#compass-svg [data-layer="${l.id}"]`);assert(g,l.id);assert(g.querySelectorAll('[data-ring]').length===l.cells.length,l.id+' must render every cell')}
assert(!$('.replica-levels')&&!$('#scene-file')&&!$('.replica-hint'),'no simulated levels, camera or app hint');
const labels=[...w.document.querySelectorAll('#compass-svg text')];
for(const t of labels){const font=+t.getAttribute('font-size');if(font)assert(font>0&&Number.isFinite(font))}
for(let n=0;n<30;n++)$('[data-act="zoom-in"]').click();
assert.equal($('#zoom-value').value,'12×');
assert.equal($('#compass-stage').dataset.renderMode,'detail');
assert($('#compass-svg .viewport').getAttribute('transform').includes('scale(12)'),'zoom must be applied to SVG geometry, not a compositor bitmap');
assert.equal($('#dial-viewport').style.transform,'translate3d(0%, 0%, 0px)');assert.equal($('#dial-rotor').style.transform,'none');
w.LuopanApp.setDegree(120);assert.equal($('#compass-svg .disc').getAttribute('transform'),'rotate(-120)');
assert($('#compass-svg .viewport').getAttribute('transform').includes('scale(12)'),'rotation must preserve vector magnification');
assert(!$('#compass-svg image'),'zoom must not switch to an image');
$('[data-act="reset-pan"]').click();assert.equal($('#zoom-value').value,'1×');
assert.equal($('#compass-stage').dataset.renderMode,'composite');assert.equal($('#compass-svg .disc').getAttribute('transform'),'rotate(0)');
const firstGlyph=$('#compass-svg text');w.LuopanApp.selectLayer('yao');assert.strictEqual($('#compass-svg text'),firstGlyph,'switching rings reuses the full vector tree');
assert($('.original-band svg text'),'dense layer detail has real vector text');
assert(!$('.original-band image'),'detail must not reintroduce photos');
// Dragging within one mountain must not rebuild the entire set of SVG text labels.
w.LuopanApp.selectLayer('di');w.LuopanApp.setDegree(1);
const glyph=$('#compass-svg text'),detail=$('.original-band svg text');
w.LuopanApp.setDegree(2);
assert.strictEqual($('#compass-svg text'),glyph);assert.strictEqual($('.original-band svg text'),detail);
assert($('#reading-position').textContent.includes('2.0°'),'position text must update even when the detail is reused');
// Coalesce an event burst into one frame; never rebuild dense text while rotating.
let queued=new Map(),frameId=0;
w.requestAnimationFrame=fn=>{queued.set(++frameId,fn);return frameId};
w.cancelAnimationFrame=id=>queued.delete(id);
const flush=()=>{const f=[...queued.values()];queued.clear();f.forEach(fn=>fn())};
const stage=$('#compass-stage');stage.getBoundingClientRect=()=>({left:0,top:0,width:400,height:400});
const pointer=(type,id,x,y)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0});stage.dispatchEvent(e)};
const viewport=()=>JSON.stringify([$('#dial-viewport').style.transform,$('#compass-svg .viewport').getAttribute('transform')]);
w.LuopanApp.setDegree(0);
const bandGlyph=$('.original-band svg text'),card=$('#reading-card').innerHTML,vectorContents=$('#compass-svg').innerHTML;
pointer('pointerdown',1,200,60);
for(let i=1;i<=90;i++){const a=i*Math.PI/180;pointer('pointermove',1,200+140*Math.sin(a),200-140*Math.cos(a))}
assert.equal(queued.size,1,'90 moves schedule only one paint');
assert.equal($('#dial-rotor').style.transform,'rotate(0deg)','no synchronous per-event painting');
assert.equal($('#reading-card').innerHTML,card,'no detail writes while dragging');flush();
assert.equal($('#dial-rotor').style.transform,'rotate(-270deg)');
assert.equal($('#compass-svg').innerHTML,vectorContents,'rotation must not write into the SVG tree');
pointer('pointerup',1,340,200);assert.equal($('#bearing-number').value,'270.0');
assert.strictEqual($('.original-band svg text'),bandGlyph,'crossing mountains preserves SVG text');
// A one-degree movement at a modest radius responds without the old 5px dead zone.
w.LuopanApp.setDegree(0);pointer('pointerdown',1,200,140);
pointer('pointermove',1,200+60*Math.sin(Math.PI/180),200-60*Math.cos(Math.PI/180));flush();
assert(Math.abs(w.LuopanApp.degree-359)<.000001,'first one-degree move must follow the finger');
assert.equal($('#live-bearing').value,'359.0°','live degree feedback while the finger is down');
pointer('pointerup',1,201,140);
const d=w.LuopanApp.degree;
pointer('pointerdown',1,150,200);pointer('pointerdown',2,250,200);
pointer('pointermove',1,160,220);pointer('pointermove',2,260,220);flush();
assert.equal(w.LuopanApp.degree,d,'two fingers do not rotate');assert.equal($('#compass-stage').dataset.renderMode,'composite','parallel two-finger motion must not accidentally zoom');assert.notEqual(viewport(),'translate(0%, 0%)','two fingers pan');
pointer('pointerup',2,260,220);const view=viewport();pointer('pointermove',1,120,260);flush();
assert.equal(w.LuopanApp.degree,d,'remaining finger cannot jump the rotation');assert.equal(viewport(),view);
pointer('pointerup',1,120,260);
$('[data-act="focus-layer"]').click();const focused=viewport(),beforeDegree=w.LuopanApp.degree;
pointer('pointerdown',1,200,60);pointer('pointermove',1,340,200);flush();pointer('pointerup',1,340,200);
assert.notEqual(w.LuopanApp.degree,beforeDegree,'single finger rotates after focus');assert.equal(viewport(),focused,'single finger never pans');
assert(!$('#gesture-mode'),'no conflicting single-finger mode');
$('[data-act="lock"]').click();const lockedDegree=w.LuopanApp.degree;
stage.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
assert.equal(w.LuopanApp.degree,lockedDegree,'keyboard respects the lock');
$('[data-act="lock"]').click();
console.log('✓ 高频移动合并一帧，跨山复用字形，单指旋转／双指平移缩放及手指数切换无跳盘');
// Display controls are independent of lesson selection and exercise diagrams.
$('[data-act="visibility"]').click();assert(!$('#visibility-drawer').hidden);
const toggles=[...w.document.querySelectorAll('[data-ring-visible]')];assert.equal(toggles.length,28);
const setVisible=(id,on)=>{const el=$(`[data-ring-visible="${id}"]`);el.checked=on;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
setVisible('di',false);setVisible('pool',false);
assert.equal($('#compass-svg [data-layer="di"]').style.display,'none');
assert.equal($('#compass-svg [data-layer="pool"]').style.display,'none');
let saved=JSON.parse(w.localStorage.getItem(w.LuopanModel.KEY));assert(saved.view.hiddenLayers.includes('di')&&saved.view.hiddenLayers.includes('pool'));
const reload=new JSDOM(html,{url:'https://example.test/all-project/luopan/',runScripts:'outside-only',pretendToBeVisual:true});
const rw=reload.window;rw.scrollTo=()=>{};rw.HTMLElement.prototype.scrollIntoView=function(){};
const reloadObservers=[],ReloadObserver=rw.MutationObserver;rw.MutationObserver=class extends ReloadObserver{constructor(fn){super(fn);reloadObservers.push(this)}};
rw.localStorage.setItem(w.LuopanModel.KEY,JSON.stringify(saved));
for(const f of ['data.js','model.js','plate-data.js','dial.js','degree-memory.js','guides.js','app.js'])rw.eval(fs.readFileSync('luopan/'+f,'utf8'));
assert.equal(rw.document.querySelector('#compass-svg [data-layer="di"]').style.display,'none','reload restores hidden rings');
assert(!rw.document.querySelector('[data-ring-visible="pool"]').checked,'reload restores checkbox state');
reloadObservers.forEach(o=>o.disconnect());reload.window.close();

w.LuopanApp.setDegree(32);assert.equal($('#compass-svg [data-layer="di"]').style.display,'none','rotation preserves choices');
w.LuopanApp.selectLayer('di');assert.equal($('#compass-svg [data-layer="di"]').style.display,'','selecting a hidden ring reveals it');
assert.equal($('#compass-svg [data-layer="pool"]').style.display,'none','unrelated hidden rings stay hidden');
$('[data-visible-preset="none"]').click();assert(toggles.every(el=>!el.checked));
$('[data-visible-preset="basic"]').click();assert.deepEqual(toggles.filter(el=>el.checked).map(el=>el.dataset.ringVisible).sort(),['degree','di','pool','ren','tian'].sort());
$('[data-visible-preset="all"]').click();assert(toggles.every(el=>el.checked));
assert.equal($('#visibility-count').textContent,'已显示 28 / 28 层');
for(const l of w.LuopanApp.L){assert(w.LUOPAN_GUIDES[l.id],l.id+' guide');w.LuopanApp.selectLayer(l.id);assert.equal($('.ring-guide').dataset.guide,l.id);assert.equal($('.ring-guide').querySelectorAll('p.layer-note').length,4)}
w.LuopanApp.selectLayer('pool');assert($('.original-band svg path'),'pool illustration');
w.LuopanApp.selectLayer('jade');assert($('#reading-card').textContent.includes('格界红点'));
const dots=[...w.document.querySelectorAll('#compass-svg [data-layer="jade"] [data-cell]')];
const jade=w.LuopanApp.L.find(l=>l.id==='jade');
for(const [i,g] of dots.entries()){const c=jade.cells[i],circles=g.querySelectorAll('circle');assert.equal(circles.length,c.label==='0'?0:1,'position code must not be a point count');if(c.label==='2'){const a=(c.start+c.width)*Math.PI/180,r=(jade.r0+jade.r1)/2;assert(Math.abs(+circles[0].getAttribute('cx')-r*Math.sin(a))<.000001);assert.equal(circles[0].dataset.dotPosition,'boundary')}}
assert.equal(dots.reduce((n,g)=>n+g.querySelectorAll('circle').length,0),160);
$('[data-act="reset-pan"]').click();$('[data-act="focus-layer"]').click();
const beforePan=$('#compass-svg .viewport').getAttribute('transform'),beforeSurface=$('#dial-viewport').style.transform;
pointer('pointerdown',1,150,200);pointer('pointerdown',2,250,200);pointer('pointermove',1,165,215);pointer('pointermove',2,265,215);flush();
assert.equal($('#compass-svg .viewport').getAttribute('transform'),beforePan,'short pan reuses the final-resolution vector surface');assert.notEqual($('#dial-viewport').style.transform,beforeSurface);
assert($('#compass-overlay .crosshair').getAttribute('transform').includes('scale(2.5)'),'reading lines scale with the disk');
pointer('pointerup',1,165,215);pointer('pointerup',2,265,215);
console.log('✓ 32项讲解、天池入口、384格单点/界线点语义，以及双指平移复用清晰图层通过');

$('[data-act="close-drawers"]').click();assert($('#visibility-drawer').hidden);
console.log('✓ 天池及27圈可逐项显隐、批量切换、即时保存，选层自动显示且不影响其他圈');
Object.defineProperty(w,'innerWidth',{value:390,writable:true});
$('[data-act="layers"]').click();assert($('#layers-drawer #inline-panel'));
$('[data-act="close-drawers"]').click();assert($('.desktop-panel #inline-panel'));
console.log('✓ 12倍在SVG内部放大，停用低分辨率合成缓存；回到1倍恢复独立旋转');
// The user's complete mnemonic text is transferred, not rewritten or renumbered.
const source=fs.readFileSync('../yangong-beisong/index.html','utf8'),a=source.indexOf('const DG_CODE='),b=source.indexOf('const dgCode=',a),reference={};
require('vm').runInNewContext(source.slice(a,b)+';this.data={codes:DG_CODE,items:DG,groups:DG_GROUPS}',reference);
assert.deepEqual(JSON.parse(JSON.stringify(w.LUOPAN_DEGREE_MEMORY)),JSON.parse(JSON.stringify(reference.data)));
assert(!$('#degree-memory').open);assert.equal(w.document.querySelectorAll('.degree-memory-item').length,24);assert([...w.document.querySelectorAll('.degree-memory-item')].every(d=>!d.open));
assert.equal(w.document.querySelectorAll('.memory-code-grid span').length,20);assert.equal($('.memory-code-grid b').textContent,'00');
$('[data-memory-turn="120"]').click();assert.equal(w.LuopanApp.degree,120);assert.equal(w.LuopanApp.layer,'di');
const mem=$('#degree-memory-辰 p');mem.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(w.YGN_HOOK.loc().scr,'degree-memory');assert.equal(w.YGN_HOOK.loc().id,'辰');
w.YGN_HOOK.go({scr:'degree-memory',id:'辰'});assert($('#degree-memory').open&&$('#degree-memory-辰').open);
console.log('✓ 杨公背诵24条原文及20项编码逐字相同，默认折叠、转盘验证与笔记定位通过');
const bg=$('#compass-svg [data-hit-ring="di"]');
for(const type of ['pointerdown','pointerup']){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:8,clientX:200,clientY:200,button:0});bg.dispatchEvent(e)}
assert.equal(w.LuopanApp.layer,'di','background clicks still select the correct layer after paint separation');
console.log('✓ 主盘与局部均为真矢量，全部已录字格可见，12倍缩放不引入图片');
console.log('✓ 无仿应用水平仪与实景，转动复用字形，小屏讲解面板可开关');
observers.forEach(o=>o.disconnect());dom.window.close();
