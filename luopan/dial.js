/* Original SVG renderer. Compass text and angular divisions are data, not a screenshot texture. */
(function(root){
'use strict';
const P=root.LUOPAN_PLATE,TAU=Math.PI/180;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const polar=(r,a)=>[r*Math.sin(a*TAU),-r*Math.cos(a*TAU)];
const pair=p=>p.map(x=>+x.toFixed(5)).join(' ');
function arc(r,a,w){return `M${pair(polar(r,a))}A${r} ${r} 0 ${w>180?1:0} 1 ${pair(polar(r,a+w))}`}
function sector(r0,r1,a,w){return `${arc(r1,a,w)}L${pair(polar(r0,a+w))}A${r0} ${r0} 0 ${w>180?1:0} 0 ${pair(polar(r0,a))}Z`}
const YELLOW='#fff398',BLACK='#17170f',LINE='#796f40',RED='#ed0b08';
const bits={乾:'111',兑:'110',离:'101',震:'100',巽:'011',坎:'010',艮:'001',坤:'000'};
function text(s,a,r,size,{color=BLACK,anchor='middle',dx=0}={}){return s?`<text transform="rotate(${a})" x="${dx}" y="${-r}" text-anchor="${anchor}" dominant-baseline="central" font-size="${size}" fill="${color}">${esc(s)}</text>`:''}
// Leave room for real CJK font ascent/descent, not just the nominal em square.
function small(s,a,r,h,maxw,color=BLACK){if(!s)return '';const fs=Math.min(h*.64,maxw/Math.max(1,[...s].length)*.86);return text(s,a,r,fs,{color})}
function stack(s,a,r,h,maxw,color=BLACK){if(!s.trim())return '';const chars=[...s],fs=Math.min(h/(chars.length+1.4),maxw*.74),step=fs*1.04;return `<text transform="rotate(${a})" text-anchor="middle" dominant-baseline="central" font-size="${fs}" fill="${color}">${chars.map((ch,j)=>`<tspan x="0" y="${-r+(j-(chars.length-1)/2)*step}">${esc(ch)}</tspan>`).join('')}</text>`}
function star(c,l){const a=c.start+c.width/2,h=l.r1-l.r0,r=(l.r0+l.r1)/2,span=c.width*TAU*r,s=c.label,fs=Math.min(h*.40,span/(s.length+.5)*.80),col=c.element==='火'?RED:c.element==='木'?'#00870a':c.element==='水'?'#0814d5':c.element==='金'?'#fffbd5':'#ffef00',ink=['火','木','水'].includes(c.element)?'#fff79e':BLACK;
// Separate the curved main label from the small element row, including very narrow宿格.
return `<path d="${sector(l.r0,l.r1,c.start,c.width)}" fill="${col}" stroke="${LINE}" stroke-width=".45"/>`+[...s].map((ch,i)=>text(ch,a+(i-(s.length-1)/2)*fs/r/TAU,r+h*.19,fs,{color:ink})).join('')+text(c.element,c.start+c.width*.80,l.r0+h*.22,Math.min(h*.18,span*.18),{color:ink});}
function cell(c,l){const h=l.r1-l.r0,r=(l.r0+l.r1)/2,a=c.start+c.width/2,w=2*r*Math.sin(c.width*TAU/2),kind=l.kind,ink=c.bg&&['#ed0b08','#00870a','#0814d5'].includes(c.bg)?'#fff8a6':BLACK;
let g=kind==='stars'?star(c,l):`<path d="${sector(l.r0,l.r1,c.start,c.width)}" fill="${c.bg||YELLOW}" stroke="${LINE}" stroke-width="${c.width<2?.24:.4}"/>`;
if(kind==='stars')return g;
if(kind==='trigram'){
 const b=bits[c.label]||'000',bar=Math.min(w*.3,h*.9),gap=h*.09,top=-r-h*.28;
 g+=`<g transform="rotate(${a})" fill="${BLACK}">`+[...b].reverse().map((x,j)=>x==='1'?`<rect x="${-bar/2}" y="${top+j*(h*.15+gap)}" width="${bar}" height="${h*.15}"/>`:`<path d="M${-bar/2} ${top+j*(h*.15+gap)}h${bar*.38}m${bar*.24} 0h${bar*.38}" stroke="${BLACK}" stroke-width="${h*.15}"/>`).join('')+'</g>';
 if(c.edge)g+=text(c.edge,c.start+c.width*.87,r,h*.42);
 if(c.left)g+=text(c.left,c.start+3,r,h*.5);
 if(c.right)g+=text(c.right,c.start+c.width-3,r,h*.5);
 return g;
}
if(kind==='mountain'){
 const fs=h*.64;
 g+=text(c.label,a,r,fs,{color:ink});
 if(c.left)g+=text(c.left,c.start+c.width*.08,l.r0+h*.25,Math.min(h*.22,w*.22),{color:ink,anchor:'start'});
 if(c.right)g+=text(c.right,c.start+c.width*.9,l.r0+h*.25,h*.24,{color:ink,anchor:'end'});
 return g;
}
if(kind==='degree'){
 const d=+c.label;
 for(let j=-5;j<5;j++){const aa=d+j,len=j===0?h*.32:j%5===0?h*.22:h*.12;g+=`<path d="M${pair(polar(l.r1-len,aa))}L${pair(polar(l.r1,aa))}" fill="none" stroke="${BLACK}" stroke-width="${j===0?.65:.35}"/>`}
 return g+text(c.label,d,l.r0+h*.37,h*.44);
}
if(kind==='dots'){
 const n=+c.label,dot=Math.min(w*.37,h*.32);
 for(let j=0;j<n;j++){const p=polar(r,c.start+c.width*(n===2?(j===0?.3:.7):.5));g+=`<circle cx="${p[0]}" cy="${p[1]}" r="${dot*.7}" fill="${RED}"/>`}
 return g;
}
if(kind==='marks'){
 const mark=c.label;if(mark==='。'){const p=polar(r,a);g+=`<circle cx="${p[0]}" cy="${p[1]}" r="${Math.min(w*.3,h*.33)}" fill="${RED}"/>`}
 else if(mark==='x')g+=`<path d="M${pair(polar(l.r0,c.start))}L${pair(polar(l.r1,c.start+c.width))}M${pair(polar(l.r0,c.start+c.width))}L${pair(polar(l.r1,c.start))}" stroke="${LINE}" stroke-width=".35"/>`;
 else if(mark==='、')g+=`<path transform="rotate(${a})" d="M${-w*.16} ${-r-h*.2}q${w*.4} ${h*.1} ${w*.3} ${h*.45}" fill="none" stroke="${BLACK}" stroke-width="${Math.max(.5,w*.2)}"/>`;
 else if(mark==='人')g+=text('人',a,r,Math.min(h*.62,w*.72));
 return g;
}
if(kind==='yaodirection')return g+text(c.label,a,r-h*.13,h*.47)+text(c.left,c.start+c.width*.12,l.r1-h*.23,h*.31)+text(c.right,c.start+c.width*.88,l.r1-h*.23,h*.31);
return g+(kind==='stack'?stack(c.label,a,r,h,w,ink):small(c.label,a,r,h,w,ink))+(c.left?small(c.left,a,r-h*.25,h*.4,w,ink):'');
}
const ringCache=new Map();
function ring(l){if(!ringCache.has(l.id))ringCache.set(l.id,`<g class="ring" data-layer="${l.id}">${l.cells.map((c,i)=>`<g data-ring="${l.id}" data-cell="${i}">${cell(c,l)}</g>`).join('')}</g>`);return ringCache.get(l.id)}
function pool(){let s=`<circle r="${P.poolRadius}" fill="#fffce4" stroke="#ad8c3b" stroke-width="2.3"/><circle r="${P.poolRadius-4}" fill="#fffefa" stroke="#a8a391" stroke-width=".6"/>`;
for(let i=0;i<72;i++)s+=`<path d="M${pair(polar(P.poolRadius-8,i*5))}L${pair(polar(P.poolRadius-5,i*5))}" stroke="#8c8c82" stroke-width=".35"/>`;
for(const [i,ch] of ['北','东','南','西'].entries())s+=text(ch,i*90,P.poolRadius*.68,10);
s+='<path d="M0-54L-3.8-5L0 4L3.8-5Z" fill="#b42d29"/><path d="M0 54L-3.8 5L0-4L3.8 5Z" fill="#20201e"/><circle r="4" fill="#9c792d"/><circle cx="-4" cy="-49" r="2.3" fill="#b42d29"/><circle cx="4" cy="-49" r="2.3" fill="#b42d29"/>';
return s;
}
function render({focus=null,dim=false}={}){
 const id=focus,ls=id?P.layers.filter(l=>l.id===id):P.layers;
 return (!id?'<circle r="581" fill="#f5e68e" stroke="#17170f" stroke-width="1.5"/>':'')+ls.map(l=>`<g opacity="${dim&&id&&l.id!==id?.15:1}">${ring(l)}</g>`).join('')+(!id?`<g data-layer="pool">${pool()}</g>`:'');
}
root.LuopanDial={render,ring,layers:P.layers,pool,polar,esc};
})(window);
