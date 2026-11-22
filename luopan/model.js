/* Pure geometry and practice logic; bearings increase clockwise from north. */
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.LuopanModel=m})(typeof window!=='undefined'?window:globalThis,()=>{
'use strict';
const M=[...'子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'];
const norm=d=>((d%360)+360)%360,delta=(a,b)=>norm(a-b+180)-180;
const slot=d=>Math.floor(norm(d+7.5)/15)%24;
const mountain=d=>M[slot(d)],opposite=d=>norm(d+180);
const between=d=>Math.abs(Math.abs(delta(d,slot(d)*15))-7.5)<1e-7;
const element=s=>['亥壬子癸','寅甲卯乙巽','巳丙午丁','庚申辛酉乾','辰戌丑未坤艮'].map((x,i)=>x.includes(s)?['水','木','火','金','土'][i]:'').find(Boolean);
const dual=s=>['壬子乙辰坤申','癸丑巽巳庚酉','艮寅丙午辛戌','甲卯丁未乾亥'].map((x,i)=>x.includes(s)?['水','金','火','木'][i]:'').find(Boolean);
const yuan=s=>['辰戌丑未甲庚壬丙','子午卯酉乾坤艮巽','乙辛丁癸寅申巳亥'].map((x,i)=>x.includes(s)?['地元','天元','人元'][i]:'').find(Boolean);
const najia=s=>[['乾甲','乾'],['坤乙','坤'],['子癸申辰','坎'],['午壬寅戌','离'],['艮丙','艮'],['巽辛','巽'],['卯庚亥未','震'],['酉丁巳丑','兑']].find(([ss])=>ss.includes(s))?.[1];
const hou=['坎','艮','震','巽','离','坤','兑','乾'],xian=['坤','震','离','兑','乾','巽','坎','艮'];
const dir=['北','东北','东','东南','南','西南','西','西北'];
function read(d){d=norm(d);const i=slot(d),off=delta(d,i*15),a=M[(i+(off<0?23:1))%24];return {degree:d,shan:M[i],sitting:mountain(opposite(d)),center:i*15,offset:off,edge:between(d),neighbors:[M[(i+23)%24],M[(i+1)%24]],range:[norm(i*15-7.5),norm(i*15+7.5)],direction:dir[Math.floor(norm(d+22.5)/45)],palace:hou[Math.floor(norm(d+22.5)/45)],element:element(M[i]),dual:dual(M[i]),yuan:yuan(M[i]),jian:Math.abs(off)<.05?'正中':`偏向${a} ${Math.abs(off).toFixed(1)}°`}}
function layers(D){const cells=(n,start,w,fn)=>Array.from({length:n},(_,i)=>({label:fn(i),start:start+i*w,width:w}));let sum=0;
return [
 {id:'xian',name:'先天八卦',r0:70,r1:108,cells:cells(8,-22.5,45,i=>xian[i]),source:'中级第165页；与杨公背诵先天图对照',note:'先看卦在什么方位：南乾、北坤、东离、西坎。它与后天八卦同用一圈方位，卦的位置不同。'},
 {id:'hou',name:'后天八卦',r0:108,r1:148,cells:cells(8,-22.5,45,i=>hou[i]),source:'中级第165页；与杨公背诵后天图对照',note:'把周围先分成八个大方向。北坎、东北艮、东震、东南巽、南离、西南坤、西兑、西北乾。每一宫再分三个山。'},
 {id:'element',name:'正体五行',r0:148,r1:177,cells:cells(24,-7.5,15,i=>element(M[i])),source:'中级第152页',note:'这一圈回答“这个山按正体五行属什么”。例如辰属土、巽属木。不要拿双山五行替换它。'},
 {id:'di',name:'地盘二十四山',r0:177,r1:222,cells:cells(24,-7.5,15,i=>M[i]),source:'初级第175、178页；家居第348页',note:'先读这一层。子为0°、卯90°、午180°、酉270°；相邻山中心差15°。上方红线读前方，正对面的红线读后方；测坐向时，前方是向、后方是坐。'},
 {id:'dragon',name:'穿山七十二龙',r0:222,r1:260,cells:cells(72,347.5,5,i=>D.dragon[i]),source:'本地七十二龙盘式表；中级第153页纳音举例',note:'此盘式每格5°，六十个干支格与十二个空亡格合成七十二格。先学定位和读字；“空亡”是本层格名，不能据一个格名直接断一处地方的吉凶。'},
 {id:'fenjin',name:'一百二十分金',r0:260,r1:300,cells:cells(120,-7.5,3,i=>D.fenjin[i]),source:'初级第176–179页；家居第348页；本地分金盘式表',note:'一山15°再分五格，每格3°，一圈120格。它就像尺子上的小刻度，让同一个山里的位置分得更细。干支依这张盘式表显示，不据此单独下吉凶结论。'},
 {id:'yuan',name:'地天人三元龙',r0:300,r1:326,cells:cells(24,-7.5,15,i=>yuan(M[i])),source:'中级第151页',note:'每宫三个山，分别归地元、天元、人元。例：壬为地元、子为天元、癸为人元。辰是地元，巽是天元，巳是人元。这里的“三元龙”不等于地盘、人盘、天盘。'},
 {id:'najia',name:'纳甲配卦',r0:326,r1:350,cells:cells(24,-7.5,15,i=>najia(M[i])),source:'初级第188页纳甲理',note:'这一圈显示山字归哪一卦：乾甲、坤乙、子癸申辰、午壬寅戌、艮丙、巽辛、卯庚亥未、酉丁巳丑。它与后天八卦的方位分宫不同，例如辰在后天巽宫，在此却归坎卦。这里只练配卦，不把有异文的阴阳归类合成唯一答案。'},
 {id:'dual',name:'双山五行',r0:350,r1:377,cells:cells(12,-22.5,30,i=>{const s=M[(i*2+23)%24];return s+M[i*2]+'·'+dual(s)}),source:'中级第152页',note:'两山一组：壬子、癸丑、艮寅、甲卯等。它按三合归类，例如乙辰属水；同一个辰在正体五行却属土。两套都要带着名称读。'},
 {id:'gua',name:'六十四卦',r0:377,r1:418,cells:cells(64,0,360/64,i=>D.gua[i]),source:'中级第163–164页；本地六十四卦盘式表',note:'这一圈把周天再分成六十四卦。先学从红线找到卦名，再往外看爻格。名称与顺序依本盘式表；它不按二十四山一山一个卦来排。'},
 {id:'yao',name:'卦内爻位',r0:418,r1:436,cells:cells(384,0,360/384,i=>D.yao[i]),source:'本地卦爻分金盘式表',note:'六十四卦各有六爻，共384小格，每格0.9375°。这层很细，点“看清本层”后再读；各卦爻位顺逆依原表，不把初爻一律排在同一边。'},
 {id:'ren',name:'人盘二十四山',r0:436,r1:470,cells:cells(24,-15,15,i=>M[i]),source:'初级第178页；本地三盘偏移表',note:'这是与地盘错开半山的另一圈。这里用来观察三盘位置差，读数按本盘式。你的教材在初级第178页说明，测山峰与来去水都用地盘，不把通行三盘分工直接套入本门。'},
 {id:'tian',name:'天盘二十四山',r0:470,r1:504,cells:cells(24,0,15,i=>M[i]),source:'初级第178页；本地三盘偏移表',note:'与地盘相差半山，方向与人盘相反。先看同一条红线在三圈各压哪个字，再区分盘式对照和教材实际用法。不要把三盘名字与本门“三针”定义混成一件事。'},
 {id:'xiu',name:'二十八宿',r0:504,r1:545,cells:D.xiu.names.map((name,i)=>{const width=D.xiu.widths[i]/365.25*360;sum+=width;return {label:name,start:-sum,width}}),source:'本地二十八宿盘式表（365.25古度）',note:'本盘这圈宽窄不等，古度合365.25再铺满周天360°；0°在虚危之间。不同罗盘版本可能不同。这里用于认识盘层和读字，不把古度当成外圈的现代方位度数。'},
 {id:'degree',name:'周天度数',r0:545,r1:574,cells:cells(36,-5,10,i=>String(i*10)),source:'二十四山度数表；家居第348页',note:'0°是北，顺时针东90°、南180°、西270°，回到360°就是0°。先看红线压多少度，再找对应的山。这里是手动学习盘，数值由你转动设定。'}
]}
function cellAt(layer,d){return layer.cells.find(c=>norm(d-c.start)<c.width-1e-8)||layer.cells.find(c=>norm(d-c.start)<c.width+1e-7)||layer.cells[0]}
function shuffle(a,rng=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function bank(D){const qs=[];const add=(id,type,prompt,answer,options,degree,explain)=>qs.push({id,type,prompt,answer,options,degree,explain});
 M.forEach((s,i)=>{const d=i*15,reverse=M[(i+12)%24],pool=[s,M[(i+1)%24],M[(i+23)%24],reverse];
  add('degree-'+s,'degree',`前方红线为 ${norm(d+3)}°，地盘落在哪一山？`,s,pool,norm(d+3),`${s}的中心是${d}°，向两边各7.5°。${norm(d+3)}°仍在${s}的范围。`);
  add('turn-'+s,'turn',`把地盘“${s}”的正中转到上方红线，再点确认。`,s,[],d,`${s}的中心是${d}°。先定位四正，再按相邻15°找它；本练习允许偏差2°。`);
  add('sit-'+s,'sit',`房屋朝向 ${d}°，该怎样读坐山朝向？`,`${reverse}山${s}向`,[`${reverse}山${s}向`,`${s}山${reverse}向`,`${M[(i+13)%24]}山${M[(i+1)%24]}向`,`${M[(i+11)%24]}山${M[(i+23)%24]}向`],d,`前方${s}${d}°是向；后方相差180°，为${reverse}${opposite(d)}°，所以坐${reverse}向${s}。`);
  add('element-'+s,'element',`地盘“${s}”按正体五行属什么？`,element(s),['金','木','水','火','土'],d,`正体五行：${s}属${element(s)}。请带着“正体”二字记，不用另一套五行替代。`);
  add('dual-'+s,'dual',`同一个“${s}”，按双山五行属什么？`,dual(s),['金','木','水','火'],d,`双山五行：${s}归${dual(s)}局；正体五行则属${element(s)}。两套分类回答不同的问题。`);
  add('yuan-'+s,'yuan',`在三元龙层，“${s}”属于哪一元？`,yuan(s),['地元','天元','人元'],d,`${s}是${yuan(s)}龙。这是山字的分类，不是叫你改用同名的三盘。`);
 });
 [['water-in','来水','午','来午水',['来午水','子山午向来水','午山子向来水','子方来水']],['water-out','去水','辰','去辰水',['去辰水','戌山辰向去水','辰山戌向去水','去戌水']],['peak','山峰','申','申峰',['申峰','寅山申向峰','申山寅向峰','寅峰']],['dragon','入首龙','亥','亥龙入首',['亥龙入首','巳龙入首','亥山巳向来龙','巳山亥向来龙']],['room','卧室','艮','卧室在艮方',['卧室在艮方','卧室坐艮向坤','卧室坐坤向艮','卧室在坤方']]].forEach(([id,obj,s,a,opts])=>add('field-'+id,'field',`已按教材操作测${obj}，前方红线在“${s}”正中，应怎样报读？`,a,opts,M.indexOf(s)*15,`测${obj}报对象所在的前方，不把它说成房屋坐向。教材初级第175页分别说明这五种读法。`));
 add('division-120','field','一山15°，120分金在每山分成五格，每格是多少度？','3°',['3°','5°','7.5°','15°'],0,'15°÷5＝3°。格子越细，定位越细，但不能只凭格名判断吉凶。');
 add('field-di','field','按这套教材，测山峰和来去水的方位以哪一盘为主？','地盘',['地盘','人盘','天盘'],0,'初级第178页明确回答“我们都是用地盘”。不要把其他用法的三盘分工当成本门规则。');
 if(D){for(const l of layers(D).filter(x=>['di','ren','tian'].includes(x.id))){for(let i=0;i<8;i++){const c=l.cells[Math.floor(i*l.cells.length/8)],d=norm(c.start+c.width/2),pool=[...new Set(l.cells.map(x=>x.label))],opts=[c.label,...pool.filter(x=>x!==c.label).filter((x,j)=>j%Math.max(1,Math.floor((pool.length-1)/3))===0).slice(0,3)];const q={id:'read-'+l.id+'-'+i,type:'read',layer:l.id,prompt:`沿红线看“${l.name}”这一圈，红线压在哪个字或格名上？`,answer:c.label,options:opts,degree:d,explain:`本题${l.name}读到“${c.label}”。先认这一圈，再沿固定红线找压字；不同罗层的读数不能互相顶替。`,source:l.source};qs.push(q)}}}
 return qs;
}
const KEY='luopan_learning_v1',DAY=864e5,STEPS=[1,3,7,14,30];
const empty=()=>({v:1,view:{degree:115.7,layer:'di',mode:'full'},items:{},attempts:0,correct:0,sessions:[],round:null});
function load(storage){try{const s=JSON.parse(storage.getItem(KEY));if(s&&s.v===1&&s.items&&typeof s.items==='object'&&!Array.isArray(s.items)){const e=empty();return {...e,...s,view:{...e.view,...s.view},sessions:Array.isArray(s.sessions)?s.sessions:[]}}}catch(e){}return empty()}
function start(s,qs,label='每日八题'){s.round={id:Date.now()+'-'+Math.random().toString(36).slice(2),label,queue:qs.map(q=>({id:q.id,options:shuffle(q.options)})),i:0,answers:{},done:false};return s.round}
function answer(s,q,pick,at=Date.now()){const r=s.round;if(!r||r.done||r.queue[r.i]?.id!==q.id||r.answers[r.i])return null;const right=q.type==='turn'?Math.abs(delta(+pick,q.degree))<=2:pick===q.answer;const a={pick,right,at};r.answers[r.i]=a;const t=s.items[q.id]||{attempts:0,correct:0,wrong:0,streak:0,active:false};t.attempts++;t.correct+=right?1:0;t.wrong+=right?0:1;t.at=at;t.last=right;t.pick=pick;if(!right){t.active=true;t.streak=0;t.level=-1;t.due=at+DAY}else if(t.lastRound!==r.id){t.streak++;t.level=Math.min((t.level??-1)+1,STEPS.length-1);t.due=at+STEPS[t.level]*DAY;if(t.streak>=2)t.active=false}t.lastRound=r.id;s.items[q.id]=t;s.attempts++;s.correct+=right?1:0;return a}
function next(s){const r=s.round;if(!r||r.done||!r.answers[r.i])return false;r.i++;if(r.i>=r.queue.length){r.done=true;s.sessions.unshift({id:r.id,at:Date.now(),label:r.label,total:r.queue.length,correct:Object.values(r.answers).filter(x=>x.right).length});s.sessions=s.sessions.slice(0,90)}return true}
function order(qs,s,now=Date.now()){return qs.slice().sort((a,b)=>{const x=s.items[a.id],y=s.items[b.id];const rank=x=>!x?1:x.active?0:x.due<=now?2:3;return rank(x)-rank(y)||(x?.at||0)-(y?.at||0)})}
return {M,norm,delta,slot,mountain,opposite,between,element,dual,yuan,najia,hou,xian,dir,read,layers,cellAt,shuffle,bank,KEY,DAY,empty,load,start,answer,next,order};
});
