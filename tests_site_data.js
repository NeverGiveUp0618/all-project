const fs=require('fs'),vm=require('vm'),assert=require('assert'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');let checks=0;
const ok=(x,m)=>{assert(x,m);checks++;console.log('✓',m)};
function page(data={}){return new JSDOM(html,{url:'https://nevergiveup0618.github.io/all-project/',runScripts:'dangerously',beforeParse(w){for(const [k,v]of Object.entries(data))w.localStorage.setItem(k,JSON.stringify(v))}})}
const badge=(d,k)=>d.window.document.querySelector(`[data-app="${k}"] .badge`).textContent;
const source={};vm.runInNewContext(fs.readFileSync('../mangpai-course/data/data-meta.js','utf8'),{window:source});
let d=page();ok(d.window.YST_COUNTS.mangpai.course===source.DATA_META.counts.course,'首页总量来自实际子站教材数据');ok(d.window.YST_COUNTS.zeri.questions===JSON.parse(fs.readFileSync('../zeri-web/question-bank/questions.json')).length,'择日总题量与已发布题目源一致');d.window.close();
const textbook={v:1,seen:{a:{attempts:3},b:{attempts:1}},wrong:{a:{active:true},old:{active:false}}},terms={v:1,seen:{t:{attempts:1}},wrong:{t:{active:true}}};
d=page({zeri_qbank_v1:textbook,zeri_terms_v1:terms,zeri_wrong_v1:Array(99).fill('old')});let s=badge(d,'zeri');ok(s.includes('教材已练 2/1413 题')&&s.includes('名词已练 1/446 题'),'教材与名词分开按唯一已练题计数，不累计重复作答');ok((s.match(/待订正 1/g)||[]).length===2&&!s.includes('99'),'仅计算active错题，不混旧课程与已订正记录');ok(d.window.localStorage.getItem('zeri_qbank_v1')===JSON.stringify(textbook),'首页只读取作答数据，不修改学习记录');d.window.close();
d=page({zeri_qbank_v1:{v:1,seen:{},wrong:{}},yst_stat_zeri:{text:'错题200'},zeri_wrong_v1:['old']});ok(!badge(d,'zeri'),'新题库空记录不被旧看板缓存顶替');d.window.close();
d=page({zeri_qbank_v1:null,zeri_terms_v1:null});ok(!badge(d,'zeri'),'null存储安全回退');d.window.close();
d=page({mp_course_read:{c1:100,n1:100,bh01:100},mp_course_seen:{one:1},mp_course_counts:{course:68,notes:17,quiz:791,plain:5},bazi_course_read:{c1:100,n1:100},bazi_course_seen:{one:1},bazi_course_counts:{course:16,notes:15,quiz:334},liuren_course_read:{L01:100,B01:100,extra:100}});
s=badge(d,'mangpai');ok(s.includes('1/78 讲')&&s.includes('1/936 题')&&s.includes('白话 1/19 课'),'盲派旧缓存总量更新，白话进度独立显示');s=badge(d,'jingjiang');ok(s.includes('1/24 篇')&&s.includes('1/812 题'),'命理精讲旧缓存不再显示旧分母');s=badge(d,'lrcourse');ok(s.includes('通解读完 1/25 课')&&s.includes('初中级读完 1/20 课'),'六壬两套课程分别统计，其他已读内容不混入课数');d.window.close();
console.log('通过',checks,'项首页数据与进度检查');
