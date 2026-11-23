/* Rendering/interaction regressions: an enlarged screenshot is not a vector disk. */
const fs=require('fs'),assert=require('assert'),{JSDOM}=require('../bazi-course/node_modules/jsdom');
const html=fs.readFileSync('luopan/index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/all-project/luopan/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,$=s=>w.document.querySelector(s);
const observers=[],NativeObserver=w.MutationObserver;w.MutationObserver=class extends NativeObserver{constructor(fn){super(fn);observers.push(this)}};
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
for(const f of ['data.js','model.js','plate-data.js','dial.js','app.js'])w.eval(fs.readFileSync('luopan/'+f,'utf8'));
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
assert($('#compass-svg .viewport').getAttribute('transform').includes('scale(12)'));
assert(!$('#compass-svg image'),'zoom must not switch to an image');
$('[data-act="reset-pan"]').click();assert.equal($('#zoom-value').value,'1×');
w.LuopanApp.selectLayer('yao');
assert($('.original-band svg text'),'dense layer detail has real vector text');
assert(!$('.original-band image'),'detail must not reintroduce photos');
// Dragging within one mountain must not rebuild the entire set of SVG text labels.
w.LuopanApp.selectLayer('di');w.LuopanApp.setDegree(1);
const glyph=$('#compass-svg text'),detail=$('.original-band svg text');
w.LuopanApp.setDegree(2);
assert.strictEqual($('#compass-svg text'),glyph);assert.strictEqual($('.original-band svg text'),detail);
assert($('#reading-position').textContent.includes('2.0°'),'position text must update even when the detail is reused');
Object.defineProperty(w,'innerWidth',{value:390,writable:true});
$('[data-act="layers"]').click();assert($('#layers-drawer #inline-panel'));
$('[data-act="close-drawers"]').click();assert($('.desktop-panel #inline-panel'));
console.log('✓ 主盘与局部均为真矢量，全部已录字格可见，12倍缩放不引入图片');
console.log('✓ 无仿应用水平仪与实景，转动复用字形，小屏讲解面板可开关');
observers.forEach(o=>o.disconnect());dom.window.close();
