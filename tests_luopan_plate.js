const fs=require('fs'),vm=require('vm'),assert=require('assert'),C=require('./luopan/model.js'),ctx={window:{}};vm.runInNewContext(fs.readFileSync('luopan/plate-data.js','utf8'),ctx);const P=ctx.window.LUOPAN_PLATE,L=P.layers,get=id=>L.find(l=>l.id===id),at=(id,d)=>C.cellAt(get(id),d);
assert.equal(L.length,27);assert.equal(P.menuCount,28);assert.equal(new Set(L.map(l=>l.id)).size,27);
for(const l of L){assert(Math.abs(l.cells.reduce((a,c)=>a+c.width,0)-360)<1e-5,l.id);assert(l.r1>l.r0);for(const c of l.cells){assert(!/[�\ud800-\udfff]/.test(c.label));assert(c.width>0);assert.strictEqual(C.cellAt(l,(c.start+c.width/2)%360),c)}}
for(const [id,n] of [['dragon',72],['fenjin',120],['tianfenjin',120],['gua',64],['square',64],['jade',384],['xiu',28],['shixian',28],['yingsuo',61]])assert.equal(get(id).cells.length,n,id);
for(let i=0;i<24;i++){assert.equal(at('di',i*15).label,C.M[i]);assert.equal(at('ren',(i*15-7.5+360)%360).label,C.M[i]);assert.equal(at('tian',i*15+7.5).label,C.M[i])}
assert(at('xiu',116).label.startsWith('角12'));assert(at('shixian',116).label.startsWith('轸'));
assert.equal(at('di',120).left,'土');assert.equal(at('ren',112.5).left,'金');assert(at('tian',120).right.startsWith('水'));
assert.notEqual(at('xiu',0).width,at('xiu',45).width);
console.log('✓ 同款27环带＋天池、2934分格完整，星宿不等宽及三盘偏移独立校核');
