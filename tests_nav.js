/* 导航首页冒烟测试。
   ⭐ 最要紧的一条：**卡片顺序必须固定**（壹贰叁…按 html 原样），
      不能再按使用频率重排——位置是记忆，序号也印在卡片上，一重排就乱。 */
const fs = require('fs');
const path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { ({ JSDOM } = require(path.join(__dirname, '..', 'bazi-course', 'node_modules', 'jsdom'))); }

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m)); };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const view = fs.readFileSync(path.join(__dirname, 'view.html'), 'utf8');

// 故意把最后一个 App 的使用次数刷到最高——顺序若还固定，才说明真的不重排了
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://nevergiveup0618.github.io/all-project/',
  beforeParse(w) {
    w.localStorage.setItem('wst_usage', JSON.stringify({ lrcourse: 99, fengshui: 50 }));
    w.localStorage.setItem('liuren_course_read', JSON.stringify({ L01: 100, L02: 95, L03: 40 }));
    w.localStorage.setItem('liuren_course_counts', JSON.stringify({ lesson: 25, planned: 25 }));
  }
});
const d = dom.window.document;
setTimeout(() => {
  const cards = [...d.querySelectorAll('.card')];
  const keys = cards.map(c => c.getAttribute('data-app'));
  const nos = cards.map(c => c.querySelector('.no').textContent);

  console.log('\n== 顺序固定 ==');
  ok(cards.length === 8, '8 张卡片');
  ok(keys.join() === 'bazi,xiangfa,liuren,zeri,yangong,fengshui,jingjiang,lrcourse',
     '顺序＝html 原序（即便 lrcourse 用了 99 次也没被提到前面）');
  ok(nos.join() === '壹,贰,叁,肆,伍,陆,柒,捌', '序号仍是壹到捌，没乱');
  ok(!/appendChild\(c\)/.test(html) || !/sort\(function\(a,b\)/.test(html),
     '源码里没有按频率重排的逻辑');

  console.log('\n== 看板 ==');
  const on = cards.filter(c => c.querySelector('.badge').className.includes('on'));
  ok(on.length >= 1, `有 ${on.length} 张卡片显示了学习进度`);
  const lr = d.querySelector('.card[data-app="lrcourse"] .badge');
  ok(/读完 <b>2<\/b>\/25 课/.test(lr.innerHTML), '六壬课程读到 2/25（分母读 counts.lesson）');

  console.log('\n== 两处 App 名一致 ==');
  const names = [...html.matchAll(/(\w+):'([^']+)'/g)].filter(m => keys.includes(m[1]));
  ok(names.length === 8, 'index.html 的 NAMES 覆盖 8 个 App');
  ok(names.every(m => new RegExp(m[1] + '\\s*:\\s*\\{u:').test(view)), 'view.html 的 APP 表也都有');

  console.log(`\n${fail ? '✗' : '✓'} 通过 ${pass} 项，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
}, 300);
