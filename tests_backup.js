const {JSDOM}=require('jsdom');const fs=require('fs');const zlib=require('zlib');
/* 备份页的重度场景测试：一份"什么都学过"的数据能不能原样搬到新设备。
   ⚠️ jsdom 没有 CompressionStream，用 node 的 zlib 等价顶上——
      真实浏览器走原生 gzip，压缩率与这里一致（实测 85%）。 */
const path=require('path');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'backup.html'),'utf8');
let pass=0,fail=0;
const ok=(c,m)=>{c?(pass++,console.log('  ✓ '+m)):(fail++,console.log('  ✗ '+m));};
const seen={},read={},q={},lr={},gs={},srs={};
for(let i=1;i<=375;i++)seen[i]=1756000000000+i*1000;
for(let i=1;i<=16;i++){read['c'+i]=100;read['n'+i]=100;}
for(let i=1;i<=126;i++)q[i]=1;
for(let i=1;i<=25;i++)lr['L'+String(i).padStart(2,'0')]=100;
for(let i=1;i<=200;i++)gs['A#'+i]=1;
for(let i=1;i<=421;i++)srs['k'+i]={reviews:3,next:1756000000000};
const store={bazi_cat_stats:JSON.stringify({财:{a:200,e:40},官:{a:150,e:22}}),
 bazi_course_seen:JSON.stringify(seen),bazi_course_read:JSON.stringify(read),
 liuren_course_read:JSON.stringify(lr),liuren_course_qseen:JSON.stringify(q),
 guanshan_read:JSON.stringify(gs),guanshan_srs:JSON.stringify(srs)};
// 真实浏览器有原生 CompressionStream；jsdom 没有，用 zlib 等价顶上
function polyfill(w){
  w.CompressionStream=function(){this.k='gz'};
  w.DecompressionStream=function(){this.k='gunz'};
  w.Blob=class{constructor(a){this.data=a[0];} stream(){return {data:this.data,pipeThrough(cs){return {data:this.data,k:cs.k};}};}};
  w.Response=class{constructor(s){this.s=s;}
    arrayBuffer(){const src=typeof this.s.data==='string'?Buffer.from(this.s.data,'utf8'):Buffer.from(this.s.data);
      const b=zlib.gzipSync(src);return Promise.resolve(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));}
    text(){const src=Buffer.from(this.s.data);return Promise.resolve(zlib.gunzipSync(src).toString('utf8'));}};
}
const A=new JSDOM(html,{runScripts:'dangerously',url:'https://x.io/all/backup.html',
  beforeParse(w){polyfill(w);for(const k in store)w.localStorage.setItem(k,store[k]);}});
setTimeout(()=>{const dA=A.window.document;
 dA.getElementById('gen').click();
 const payload=dA.getElementById('out').value;
 dA.getElementById('link').click();
 setTimeout(()=>{
  const urls=dA.getElementById('out').value.split('\n\n').filter(Boolean);
  const tip=dA.getElementById('m1').textContent;
  console.log('  · '+payload.length+' 字符 → '+urls.length+' 条链接');
  ok(urls.length<=3,`重度数据压到 ${urls.length} 条链接（不压缩要 15 条以上）`);
  ok(/压缩 (8[0-9]|9[0-9])%/.test(tip),'gzip 压缩率 80% 以上：'+(/压缩 \d+%/.exec(tip)||[''])[0]);
  ok(urls.every(u=>u.length<3200),'每条链接都不超过 3200 字符');
  // 乙机：乱序点开全部链接
  const order=[...urls.keys()].sort(()=>Math.random()-0.5);
  let B=null,step=0;
  (function next(){
    if(step>=order.length){
      const w=B.window,d=B.window.document;
      setTimeout(()=>{
        ok(/从链接读到了备份/.test(d.getElementById('m2').textContent),'乱序点完全部分片后自动拼好');
        w.confirm=()=>true; d.getElementById('imp').click();
        const got=JSON.parse(w.localStorage.getItem('bazi_course_seen')||'{}');
        ok(Object.keys(got).length===375,'命理精讲 375 道命例记录一条不少');
        const gsv=JSON.parse(w.localStorage.getItem('guanshan_srs')||'{}');
        ok(Object.keys(gsv).length===421,'风水 421 个知识点一条不少');
        ok(JSON.parse(w.localStorage.getItem('bazi_cat_stats')||'{}')['财'].a===200,'中文键无损');
        ok(w.localStorage.getItem('_yst_frag')===null,'拼好后碎片自动清理，不占地方');
        console.log(`\n${fail?'✗':'✓'} 通过 ${pass} 项，失败 ${fail} 项`);
        process.exit(fail?1:0);
      },250);
      return;
    }
    const u=urls[order[step]];
    const prev=B;
    B=new JSDOM(html,{runScripts:'dangerously',url:u,beforeParse(w){polyfill(w);
      if(prev){const pl=prev.window.localStorage;for(let i=0;i<pl.length;i++){const k=pl.key(i);w.localStorage.setItem(k,pl.getItem(k));}}}});
    step++;
    setTimeout(next,120);
  })();
 },250);
},300);
