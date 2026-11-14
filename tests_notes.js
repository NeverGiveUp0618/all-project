/* 笔记：标记→存→常亮→复习排期→笔记本渲染/筛选/导出/去原文 */
const fs = require('fs'), path = require('path');
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { ({ JSDOM } = require(path.join(__dirname, '..', 'bazi-course', 'node_modules', 'jsdom'))); }
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m)); };
const NOTES = fs.readFileSync(path.join(__dirname, 'notes.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const P1 = '日主弱而印比有根，先看天元入命再定虚实。', P2 = '十神格局要结合作用方式一起看，不可孤立断。';
function site(url, ls) {
  const dom = new JSDOM('<!doctype html><body><h2>第7课 · 虚实</h2><div id="m"><p id="a">' + P1 + '</p><p id="b">' + P2 + '</p><p id="s">短</p></div><button id="nav">下一页</button></body>',
    { runScripts: 'outside-only', url, pretendToBeVisual: true });
  if (ls) Object.keys(ls).forEach(k => dom.window.localStorage.setItem(k, ls[k]));
  dom.window.eval(NOTES); return dom.window;
}
(async () => {
  console.log('== 站内标记 ==');
  let w = site('https://nevergiveup0618.github.io/bazi-course/'), D = w.document;
  ok(!!D.getElementById('ygnBtn'), '出现「笔」按钮');
  ok(w.YGN.appOfPath('/liuren-course/') === 'lrcourse' && w.YGN.appOfPath('/bazi-game/') === '' && w.YGN.appOfPath('/yangong-beisong/') === '', '站点识别；八字日练/杨公背诵不归任何科目');
  D.getElementById('ygnBtn').click();
  ok(D.documentElement.classList.contains('ygn-mark'), '点「笔」进入标记模式');
  D.getElementById('a').click();
  ok(D.getElementById('ygnSh') && D.getElementById('ygnSh').classList.contains('on') || !!D.getElementById('ygnSh'), '点段落弹出底部面板');
  D.getElementById('s').click();           // 太短的不当作一条
  w.document.querySelector('#ygnSh [data-k="q"]').click();
  D.querySelector('#ygnMemo').value = '和第5课口径要对照';
  D.querySelector('#ygnSh [data-a="ok"]').click();
  const items = w.YGN.all();
  ok(items.length === 1 && items[0].text === P1 && items[0].kind === 'q' && items[0].memo === '和第5课口径要对照' && items[0].app === 'jingjiang', '存入：原文/类型/批注/科目都对');
  ok(items[0].title === '第7课 · 虚实', '出处取最近的标题');
  ok(D.getElementById('a').classList.contains('ygn-q'), '原文里该段常亮');
  D.getElementById('a').click();
  ok(D.querySelector('#ygnMemo').value === '和第5课口径要对照' && !!D.querySelector('[data-a="del"]'), '再点同一段：回填已有批注，可取消标记');
  D.querySelector('#ygnSh [data-a="del"]').click();
  ok(w.YGN.all().length === 0 && !D.getElementById('a').classList.contains('ygn-q'), '取消标记后高亮消失');
  w.document.getElementById('ygnBtn').click();
  ok(!D.documentElement.classList.contains('ygn-mark'), '再点「笔」退出标记模式');
  D.getElementById('nav').click(); ok(true, '非标记模式不拦截点击');

  console.log('== 重新载入后仍亮、动态内容也亮 ==');
  const seed = JSON.stringify({ v: 1, items: [{ id: 'n1', app: 'jingjiang', title: 't', h: null, text: P2, kind: 'key', memo: '', tags: [], t: Date.now() }] });
  const tmp = site('https://nevergiveup0618.github.io/bazi-course/'); const hh = tmp.YGN.hash(P2);
  const seed2 = JSON.stringify({ v: 1, items: [{ id: 'n1', app: 'jingjiang', title: 't', h: hh, text: P2, kind: 'key', memo: '', tags: [], t: Date.now() }] });
  w = site('https://nevergiveup0618.github.io/bazi-course/', { ygn_v1: seed2 }); D = w.document;
  await sleep(600);
  ok(D.getElementById('b').classList.contains('ygn-key'), '已存的标记在新页面载入后自动高亮');
  const np = D.createElement('p'); np.textContent = P2 + ''; D.getElementById('m').appendChild(np);
  await sleep(600);
  ok(np.classList.contains('ygn-key'), '后加进来的同文段落（单页应用换页）也自动高亮');

  console.log('== 去原文定位 ==');
  w = site('https://nevergiveup0618.github.io/bazi-course/', { ygn_v1: seed2, ygn_jump: JSON.stringify({ app: 'jingjiang', h: hh, t: Date.now(), title: 't' }) }); D = w.document;
  let scrolled = 0; w.Element.prototype.scrollIntoView = function () { scrolled++; };
  await sleep(700);
  ok(scrolled >= 1 && w.localStorage.getItem('ygn_jump') === null, '按指纹找到段落并滚过去，用完清掉 jump');
  w = site('https://nevergiveup0618.github.io/liuren-course/', { ygn_v1: seed2, ygn_jump: JSON.stringify({ app: 'jingjiang', h: hh, t: Date.now() }) });
  await sleep(500); ok(w.localStorage.getItem('ygn_jump') !== null, '别的科目不抢走 jump');

  console.log('== 分屏笔记区（课程在上、笔记在下、可拖） ==');
  w = site('https://nevergiveup0618.github.io/bazi-course/', { ygn_v1: seed2 }); D = w.document;
  D.getElementById('ygnBtn').click(); D.getElementById('a').click(); D.querySelector('#ygnSh [data-a="nb"]').click();
  const box = D.getElementById('ygnNb');
  ok(!!box && /notebook\.html\?embed=1&app=jingjiang/.test(box.querySelector('iframe').src), '点「笔记本」：下方分屏出现，课程页没跳走');
  ok(w.location.pathname === '/bazi-course/' && parseInt(D.body.style.paddingBottom) > 100, '课程页仍在原地，并给底部留出笔记区高度');
  const h0 = parseInt(box.style.height), hd = box.firstChild;
  const pe = (t, y) => { const e = new w.Event(t, { bubbles: true }); e.clientY = y; e.pointerId = 1; return e; };
  hd.setPointerCapture = () => {}; hd.dispatchEvent(pe('pointerdown', 500)); hd.dispatchEvent(pe('pointermove', 420)); hd.dispatchEvent(pe('pointerup', 420));
  ok(parseInt(box.style.height) === h0 + 80 && w.localStorage.getItem('yg_nbh'), '向上拖 80px：笔记区高 80px，并记住比例');
  hd.dispatchEvent(pe('pointerdown', 500)); hd.dispatchEvent(pe('pointermove', -5000)); hd.dispatchEvent(pe('pointerup', -5000));
  ok(parseInt(box.style.height) <= Math.round(w.innerHeight * 0.85), '拖到顶也留着课程区（上限 85%）');
  const msg = d => w.dispatchEvent(new w.MessageEvent('message', { data: d, origin: 'https://nevergiveup0618.github.io' }));
  msg({ ygn: 'go', app: 'jingjiang', h: hh, title: 't' });
  ok(!!D.getElementById('ygnNb'), '同科目「原文」：笔记区不关，直接在上面定位');
  msg({ ygn: 'close' }); ok(!D.getElementById('ygnNb') && D.body.style.paddingBottom === '', '关闭后恢复原样');
  w.dispatchEvent(new w.MessageEvent('message', { data: { ygn: 'close' }, origin: 'https://evil.test' })); ok(true, '非本站消息忽略');

  console.log('== 站点钩子：正文是 div 的站（择日）也能标记 ==');
  {
    const dom = new JSDOM('<!doctype html><body><div class="bp" id="x">天德月德为择日之要，凡用事先看此二者是否到位。</div></body>', { runScripts: 'outside-only', url: 'https://nevergiveup0618.github.io/zeri/', pretendToBeVisual: true });
    dom.window.YGN_HOOK = { blocks: '.bp,.bl,.bh', loc: () => ({ v: 'detail', id: 'z1' }), go() {}, label: () => '天德月德' };
    dom.window.eval(NOTES); const d = dom.window.document;
    d.getElementById('ygnBtn').click(); d.getElementById('x').click(); d.querySelector('#ygnSh [data-a="ok"]').click();
    const it = dom.window.YGN.all()[0];
    ok(it && it.app === 'zeri' && it.loc && it.loc.id === 'z1' && it.crumb === '天德月德', 'div 正文可标记，并记下站内位置 loc 与出处名 crumb');
    await sleep(500); ok(d.getElementById('x').classList.contains('ygn-key'), 'div 正文也能常亮');
  }
  console.log('== 复习排期 ==');
  w = site('https://nevergiveup0618.github.io/all-project/notebook.html'); const Y = w.YGN;
  ok(!w.document.getElementById('ygnBtn'), '笔记本页不画「笔」按钮');
  Y.upsert({ id: 'r1', app: 'mangpai', text: 'x1', kind: 'key', tags: [], t: Date.now() - 3 * 864e5 });
  Y.upsert({ id: 'r2', app: 'mangpai', text: 'x2', kind: 'ok', tags: [], t: Date.now() - 3 * 864e5 });
  Y.upsert({ id: 'r3', app: 'mangpai', text: 'x3', kind: 'q', tags: [], t: Date.now() });
  ok(Y.isDue(Y.get('r1')) && !Y.isDue(Y.get('r2')) && !Y.isDue(Y.get('r3')), '到期：旧的重点算，已会不算，今天新存的不算');
  Y.review('r1', 'g'); let d = Y.get('r1').rv; ok(d.s === 1 && d.due - Date.now() > 1.9 * 864e5, '记得：升一档，隔 2 天');
  Y.review('r1', 'g'); d = Y.get('r1').rv; ok(d.s === 2 && d.due - Date.now() > 3.9 * 864e5, '再记得：隔 4 天');
  Y.review('r1', 'x'); d = Y.get('r1').rv; ok(d.s === 0 && d.due - Date.now() < 1.1 * 864e5, '忘了：回第 0 档，明天再来');

  console.log('== 笔记本页 ==');
  const html = fs.readFileSync(path.join(__dirname, 'notebook.html'), 'utf8');
  const mk = ls => { const dm = new JSDOM(html.replace('<script src="notes.js"></script>', '<script>' + NOTES.replace(/<\/script>/g, '<\\/script>') + '</script>'), { runScripts: 'dangerously', url: 'https://nevergiveup0618.github.io/all-project/notebook.html', pretendToBeVisual: true, beforeParse(win) { Object.keys(ls || {}).forEach(k => win.localStorage.setItem(k, ls[k])); win.HTMLElement.prototype.scrollIntoView = () => {}; } }); return dm.window; };
  let n = mk(); ok(/还没有笔记/.test(n.document.getElementById('list').textContent), '空状态有引导');
  const many = { v: 1, items: [
    { id: 'a', app: 'jingjiang', title: '第7课', h: 'h1', text: '天元入命先看日主', kind: 'key', memo: '重要', tags: ['口诀'], t: 3 },
    { id: 'b', app: 'lrcourse', title: '八门', h: 'h2', text: '先锋门直事门外事门', kind: 'q', memo: '', tags: [], t: 2 },
    { id: 'c', app: 'mangpai', title: '', h: '', text: '随手记一条', kind: 'ok', memo: '', tags: ['口诀'], t: 1, manual: 1 }] };
  n = mk({ ygn_v1: JSON.stringify(many) }); const N = n.document;
  ok(N.querySelectorAll('.card').length === 3 && N.getElementById('nAll').textContent === '3', '三条都显示，总数 3');
  ok(N.querySelectorAll('.grp').length === 3, '按科目分三组');
  N.querySelector('#kinds [data-v="q"]').click(); ok(N.querySelectorAll('.card').length === 1 && /先锋门/.test(N.getElementById('list').textContent), '按类型筛：只剩疑问');
  N.querySelector('#kinds [data-v=""]').click(); N.querySelector('#apps [data-v="mangpai"]').click(); ok(N.querySelectorAll('.card').length === 1, '按科目筛');
  N.querySelector('#apps [data-v=""]').click(); N.querySelector('#tags [data-v="口诀"]').click(); ok(N.querySelectorAll('.card').length === 2, '按标签筛：2 条');
  N.querySelector('#tags [data-v=""]').click(); const q = N.getElementById('q'); q.value = '直事'; q.dispatchEvent(new n.Event('input')); ok(N.querySelectorAll('.card').length === 1 && !!N.querySelector('mark'), '搜索并高亮命中');
  q.value = ''; q.dispatchEvent(new n.Event('input'));
  N.getElementById('fMemo').checked = true; N.getElementById('fMemo').dispatchEvent(new n.Event('change')); ok(N.querySelectorAll('.card').length === 1, '只看有批注');
  N.getElementById('fMemo').checked = false; N.getElementById('fMemo').dispatchEvent(new n.Event('change'));
  N.querySelector('.card[data-id="b"] [data-a="cyc"]').click(); ok(n.YGN.get('b').kind === 'ok', '改类型：疑问→已会');
  N.querySelector('.card[data-id="a"] [data-a="del"]').click(); ok(n.YGN.all().length === 2 && !!N.querySelector('#toast.on button'), '删除并出现撤销');
  N.querySelector('#toast button').click(); ok(n.YGN.all().length === 3, '撤销找回');
  N.getElementById('bNew').click(); N.getElementById('eText').value = '新写的口诀'; N.querySelector('#eApps [data-v="zeri"]').click(); N.getElementById('eTags').value = '背 易错'; N.getElementById('eSave').click();
  const nn = n.YGN.all().find(x => x.text === '新写的口诀'); ok(nn && nn.app === 'zeri' && nn.tags.join() === '背,易错' && nn.manual, '新建随记：科目/标签/随记标记');
  N.querySelector('.card[data-id="a"] [data-a="go"]').click(); const j = JSON.parse(n.localStorage.getItem('ygn_jump') || 'null'); ok(j && j.app === 'jingjiang' && j.h === 'h1', '「原文」写入 jump 交接');
  ok(!N.querySelector('.card[data-id="c"] [data-a="go"]'), '随记没有「原文」按钮');
  N.getElementById('bRv').click(); ok(N.getElementById('rv').classList.contains('on') || /今天没有/.test(N.getElementById('toast').textContent), '复习入口可用');
  n.localStorage.setItem('ygn_v1', JSON.stringify({ v: 1, items: [{ id: 'z', app: 'zeri', title: '八门', h: 'q', text: '口诀原文', kind: 'key', memo: '线索', tags: [], t: Date.now() - 5 * 864e5 }] }));
  n = mk({ ygn_v1: JSON.stringify({ v: 1, items: [{ id: 'z', app: 'zeri', title: '八门', h: 'q', text: '口诀原文', kind: 'key', memo: '线索', tags: [], t: Date.now() - 5 * 864e5 }] }) });
  n.document.getElementById('bRv').click(); const R = n.document;
  ok(R.getElementById('rv').classList.contains('on') && !/口诀原文/.test(R.getElementById('rvBody').textContent) && /线索/.test(R.getElementById('rvBody').textContent), '复习：先只给批注线索，原文隐藏');
  R.getElementById('rvShow').click(); ok(/口诀原文/.test(R.getElementById('rvBody').textContent), '点开才显示原文');
  R.querySelector('[data-r="g"]').click(); ok(/今日复习完成/.test(R.getElementById('rvBody').textContent) && n.YGN.get('z').rv.s === 1, '评完一条：出结算页并更新排期');
  console.log('\n' + pass + ' 通过，' + fail + ' 失败'); process.exit(fail ? 1 : 0);
})();
