/* 易术堂笔记（各学习子站 + 笔记本页共用）
   用法：<script async src="https://nevergiveup0618.github.io/all-project/notes.js"></script>
   做法：同域共享 localStorage['ygn_v1'] = {v:1, items:[…]}，所有站写同一份，笔记本页（notebook.html）直接读。
   ① 子站里：右下「笔」按钮开/关标记模式 → 点任意段落／条目 → 底部面板选 重点／疑问／已会＋写批注；
      标过的段落在原文里常亮；点「笔记本」进总笔记本。
   ② 笔记本页：只用本文件暴露的 window.YGN（存取、应用表、复习排期），不显示「笔」按钮。
   不碰各站自己的存储键；没有任何站内代码依赖本文件，删掉这一行引用即可完全撤下。
   item = {id, app, title(出处小标题), path(站内路径+hash), text, h(文本指纹), kind:'key'|'q'|'ok', memo, tags:[], t, u, rv:{s,due,n,last}, manual?} */
(function () {
  if (window.YGN) return;
  var KEY = 'ygn_v1', DAY = 864e5;
  var APPS = {
    jingjiang: { n: '命理精讲', g: '讲', dir: 'bazi-course',     c: '#d9b877' },
    lrcourse:  { n: '六壬神课', g: '壬', dir: 'liuren-course',   c: '#b79df0' },
    mangpai:   { n: '盲派八字', g: '盲', dir: 'mangpai-course',  c: '#8fd3e0' },
    xiangfa:   { n: '象义随身', g: '象', dir: 'bazi-xiangfa',    c: '#e7a97b' },
    fengshui:  { n: '风水识形', g: '峦', dir: 'fengshui',        c: '#7fc3a8' },
    zeri:      { n: '择日学习', g: '日', dir: 'zeri',            c: '#e3c26f' },
    lenormand: { n: '雷诺曼',   g: '牌', dir: 'lenormand',       c: '#e58fb0' },
    other:     { n: '随记',     g: '记', dir: '',                c: '#9aa7c4' }
  };
  var KINDS = { key: { n: '重点', c: '217,184,119' }, q: { n: '疑问', c: '224,122,106' }, ok: { n: '已会', c: '127,195,168' } };
  var STEP = [1, 2, 4, 8, 16, 32];            // 复习间隔（天）

  function read() {
    try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.items) return o; } catch (e) {}
    return { v: 1, items: [] };
  }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }
  function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return String(s || '').replace(/\s+/g, ''); }
  function hash(text) {
    var s = norm(text), a = s.slice(0, 120) + '|' + s.length, h = 5381;
    for (var i = 0; i < a.length; i++) h = ((h << 5) + h + a.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function appOfPath(p) {
    p = p || location.pathname;
    for (var k in APPS) if (APPS[k].dir && p.indexOf('/' + APPS[k].dir + '/') >= 0) return k;
    return '';
  }

  var YGN = window.YGN = {
    APPS: APPS, KINDS: KINDS, STEP: STEP, DAY: DAY,
    all: function () { return read().items; },
    saveAll: function (items) { return write({ v: 1, items: items }); },
    get: function (id) { var a = read().items; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; },
    upsert: function (it) {
      var o = read(), i, now = Date.now();
      for (i = 0; i < o.items.length; i++) if (o.items[i].id === it.id) break;
      it.u = now;
      if (i < o.items.length) o.items[i] = it; else { it.t = it.t || now; o.items.unshift(it); }
      if (!it.rv) it.rv = { s: 0, due: it.t + DAY, n: 0, last: 0 };
      write(o); return it;
    },
    remove: function (id) { var o = read(); o.items = o.items.filter(function (x) { return x.id !== id; }); write(o); },
    hash: hash, uid: uid, appOfPath: appOfPath,
    /* 复习结果：g=记得 f=模糊 x=忘了 */
    review: function (id, r) {
      var it = YGN.get(id); if (!it) return;
      var rv = it.rv || (it.rv = { s: 0, due: 0, n: 0, last: 0 }), now = Date.now();
      if (r === 'g') { rv.s = Math.min(rv.s + 1, STEP.length - 1); rv.due = now + STEP[rv.s] * DAY; }
      else if (r === 'f') { rv.due = now + DAY; }
      else { rv.s = 0; rv.due = now + DAY; }
      rv.n = (rv.n || 0) + 1; rv.last = now;
      YGN.upsert(it);
    },
    isDue: function (it) { return it.kind !== 'ok' && ((it.rv && it.rv.due) || (it.t + DAY)) <= Date.now(); }
  };

  // 笔记本页只要 API，不画「笔」按钮；杨公背诵与八字日练本来就没引用本文件
  if (/\/notebook\.html$/.test(location.pathname) || /\/all-project\/(view\.html)?$/.test(location.pathname)) return;
  var APP = appOfPath();
  if (!APP) return;

  /* ---------------- 子站：标记模式 ---------------- */
  var BLK = 'p,li,blockquote,dd,tr,pre,.verse,.kou,.q';
  var mark = false, sheet = null, map = null, busy = 0;

  function css() {
    if (document.getElementById('ygn-css')) return;
    var s = document.createElement('style'); s.id = 'ygn-css';
    var kc = KINDS, hl = '';
    ['key', 'q', 'ok'].forEach(function (k) {
      hl += '.ygn-' + k + '{background:linear-gradient(90deg,rgba(' + kc[k].c + ',.95) 0,rgba(' + kc[k].c + ',.95) 3px,rgba(' + kc[k].c + (k === 'ok' ? ',.07' : ',.15') + ') 3px)!important;border-radius:4px}';
    });
    s.textContent = hl +
      'html.ygn-mark p,html.ygn-mark li,html.ygn-mark blockquote,html.ygn-mark dd,html.ygn-mark tr,html.ygn-mark pre{cursor:pointer}' +
      'html.ygn-mark p:active,html.ygn-mark li:active,html.ygn-mark blockquote:active,html.ygn-mark tr:active{outline:1.5px dashed rgba(217,184,119,.8);outline-offset:2px}' +
      '.ygn-flash{animation:ygnf 1.6s ease 2}@keyframes ygnf{0%,100%{box-shadow:0 0 0 0 rgba(217,184,119,0)}50%{box-shadow:0 0 0 6px rgba(217,184,119,.45)}}' +
      '#ygnBtn{position:fixed;left:12px;bottom:130px;touch-action:none;z-index:90;width:40px;height:40px;border-radius:50%;border:1px solid rgba(217,184,119,.55);background:rgba(28,24,14,.78);color:#f4e6be;font:600 15px/38px "Songti SC",serif;text-align:center;padding:0;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
      '#ygnBtn.on{background:#d9b877;color:#2a2108;box-shadow:0 0 0 4px rgba(217,184,119,.3),0 4px 14px rgba(0,0,0,.35)}' +
      '#ygnTip{position:fixed;left:50%;transform:translateX(-50%);bottom:178px;z-index:90;padding:6px 14px;border-radius:20px;background:rgba(28,24,14,.92);color:#f4e6be;font:12.5px/1.5 sans-serif;white-space:nowrap;display:none;border:1px solid rgba(217,184,119,.45)}' +
      'html.ygn-mark #ygnTip{display:block}#ygnTip button{cursor:pointer}' +
      '#ygnSh{position:fixed;left:0;right:0;bottom:0;z-index:95;max-width:560px;margin:0 auto;padding:14px 16px calc(14px + env(safe-area-inset-bottom));background:#141a2b;color:#e9edf8;border-radius:18px 18px 0 0;border:1px solid rgba(217,184,119,.35);border-bottom:0;box-shadow:0 -10px 34px rgba(0,0,0,.5);font:14px/1.6 "Noto Serif SC","Songti SC",serif;transform:translateY(110%);transition:transform .22s ease}' +
      '#ygnSh.on{transform:none}#ygnSh .x{max-height:4.8em;overflow:auto;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05);font-size:13px;color:#b9c2d8;margin-bottom:10px}' +
      '#ygnSh .r{display:flex;gap:8px;margin-bottom:10px}#ygnSh .r button{flex:1;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e9edf8;font:inherit;font-size:14px;cursor:pointer}' +
      '#ygnSh textarea{width:100%;min-height:56px;resize:vertical;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#e9edf8;font:inherit;font-size:14px;box-sizing:border-box}' +
      '#ygnSh .f{display:flex;gap:8px;align-items:center;margin-top:10px}#ygnSh .f button{height:36px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#cfd6e8;font:inherit;font-size:13px;cursor:pointer}' +
      '#ygnSh .f .go{margin-left:auto;background:#d9b877;color:#2a2108;border-color:#d9b877;font-weight:600}#ygnSh .f .del{color:#e07a6a;border-color:rgba(224,122,106,.5)}' +
      '#ygnSh .r button.sel{color:#1c1608;font-weight:700}' +
      '#ygnToast{position:fixed;left:50%;transform:translateX(-50%);bottom:150px;z-index:99;padding:8px 16px;border-radius:20px;background:rgba(20,26,43,.96);color:#f4e6be;font:13px/1.5 sans-serif;border:1px solid rgba(217,184,119,.4);display:none}';
    (document.head || document.documentElement).appendChild(s);
  }

  function blockOf(el) {
    if (!el || !el.closest) return null;
    if (el.closest('#ygnSh,#ygnBtn,#ygnTip,header,nav,footer,button,input,textarea,select,.topbar,.tabbar,.bottombar')) return null;
    var b = el.closest(BLK); if (!b) return null;
    // li/tr 里套了更内层的 p 时，点到哪个取哪个（closest 已取最内层）；整块太长的容器不当作一条
    var t = norm(b.textContent);
    if (t.length < 6) return null;
    return b;
  }
  function textOf(b) { return (b.textContent || '').replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim(); }
  function heading(b) {
    var hs = document.querySelectorAll('h1,h2,h3,h4'), last = '';
    for (var i = 0; i < hs.length; i++) {
      if (hs[i].closest('#ygnSh,header,nav,.topbar')) { if (hs[i].tagName !== 'H1') continue; }
      if (hs[i].compareDocumentPosition(b) & 4) last = hs[i].textContent.trim(); else break;
    }
    return last.slice(0, 40) || (document.title || '').slice(0, 40);
  }
  /* 站点位置钩子：各站在自己的 app.js 里定义 window.YGN_HOOK = {loc(), go(loc), label?()}。
     loc() 返回「现在在哪一节」（可序列化的小对象，没有就返回 null）；go(loc) 回到那一节。 */
  function siteLoc() { try { var h = window.YGN_HOOK; return h && h.loc ? (h.loc() || null) : null; } catch (e) { return null; } }
  function siteCrumb() {
    try {
      var h = window.YGN_HOOK; if (h && h.label) return String(h.label() || '').slice(0, 40);
      var e = document.querySelector('.screen.active h1,.screen.active h2,.view.active h1,.view.active h2');
      return e ? e.textContent.trim().slice(0, 40) : '';
    } catch (x) { return ''; }
  }
  function toast(msg) {
    var t = document.getElementById('ygnToast');
    if (!t) { t = document.createElement('div'); t.id = 'ygnToast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block'; clearTimeout(t._t);
    t._t = setTimeout(function () { t.style.display = 'none'; }, 1800);
  }

  /* 把已有标记刷到原文上（按文本指纹匹配；DOM 变动后防抖重刷） */
  function paint() {
    var items = YGN.all().filter(function (x) { return x.app === APP && x.h; });
    var m = {}; items.forEach(function (x) { m[x.h] = x; });
    map = m;
    var any = items.length > 0;
    var bs = document.querySelectorAll(BLK), i, b, k;
    busy = 1;
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (!any) { if (b._ygn) { b.classList.remove('ygn-key', 'ygn-q', 'ygn-ok'); b._ygn = ''; } continue; }
      if (b.closest('#ygnSh')) continue;
      var t = b.textContent; if (!t || t.length < 6 || t.length > 1500) { if (b._ygn) { b.classList.remove('ygn-key', 'ygn-q', 'ygn-ok'); b._ygn = ''; } continue; }
      var it = m[hash(textOf(b))];
      k = it ? it.kind : '';
      if (b._ygn !== k) {
        b.classList.remove('ygn-key', 'ygn-q', 'ygn-ok');
        if (k) b.classList.add('ygn-' + k);
        b._ygn = k;
      }
    }
    busy = 0;
  }
  var pt = 0;
  function schedule() { clearTimeout(pt); pt = setTimeout(function () { paint(); tryJump(); }, 350); }

  /* 从笔记本点「去原文」：笔记本写 ygn_jump，这里等对应段落出现后滚过去闪一下 */
  var jumpDone = false, jumpAt = Date.now(), locTried = 0;
  (function applyLoc() {
    var j; try { j = JSON.parse(localStorage.getItem('ygn_jump') || 'null'); } catch (e) {}
    if (!j || j.app !== APP || !j.loc || Date.now() - j.t > 60000) return;
    var n = 0, iv = setInterval(function () {
      var h = window.YGN_HOOK;
      if (h && h.go && n > 1) { clearInterval(iv); setTimeout(function () { try { h.go(j.loc); } catch (e) {} }, 500); }
      else if (++n > 30) clearInterval(iv);
    }, 300);
  })();
  function tryJump() {
    if (jumpDone) return;
    var j; try { j = JSON.parse(localStorage.getItem('ygn_jump') || 'null'); } catch (e) {}
    if (!j || j.app !== APP || Date.now() - j.t > 60000) { jumpDone = true; return; }
    var bs = document.querySelectorAll(BLK);
    for (var i = 0; i < bs.length; i++) {
      if (hash(textOf(bs[i])) === j.h && bs[i].textContent.length >= 6) {
        if (nbBox) { bs[i].style.scrollMarginTop = '90px'; bs[i].scrollIntoView({ block: 'start', behavior: 'smooth' }); }
        else bs[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
        bs[i].classList.add('ygn-flash');
        setTimeout(function (b) { return function () { b.classList.remove('ygn-flash'); }; }(bs[i]), 3800);
        jumpDone = true; try { localStorage.removeItem('ygn_jump'); } catch (e) {} return;
      }
    }
    if (Date.now() - jumpAt > 25000) { jumpDone = true; return; }
    // 没找到：多半还没翻到那一页——提示出处，用户翻到后会自动定位
    if (!tryJump._said && j.title) { tryJump._said = 1; toast('请翻到「' + j.title + '」，到了会自动定位'); }
  }

  /* ---------------- 底部面板 ---------------- */
  function closeSheet() { if (sheet) sheet.classList.remove('on'); }
  function openSheet(b) {
    var text = textOf(b).slice(0, 600), h = hash(textOf(b));
    var ex = (map && map[h]) || null, kind = ex ? ex.kind : 'key';
    if (!sheet) { sheet = document.createElement('div'); sheet.id = 'ygnSh'; document.body.appendChild(sheet); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function draw() {
      sheet.innerHTML = '<div class="x">' + esc(text.length > 160 ? text.slice(0, 160) + '…' : text) + '</div>' +
        '<div class="r">' + ['key', 'q', 'ok'].map(function (k) {
          var on = k === kind;
          return '<button type="button" data-k="' + k + '" class="' + (on ? 'sel' : '') + '" style="' + (on ? 'background:rgb(' + KINDS[k].c + ');border-color:rgb(' + KINDS[k].c + ')' : '') + '">' + KINDS[k].n + '</button>';
        }).join('') + '</div>' +
        '<textarea id="ygnMemo" placeholder="写一句自己的话（可不写）：为什么重要、和哪条冲突、怎么记…">' + esc(ex ? ex.memo || '' : '') + '</textarea>' +
        '<div class="f">' + (ex ? '<button type="button" class="del" data-a="del">取消标记</button>' : '') +
        '<button type="button" data-a="nb">笔记本</button><button type="button" class="go" data-a="ok">' + (ex ? '保存' : '存入笔记本') + '</button></div>';
    }
    draw();
    sheet.onclick = function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.k) { kind = t.dataset.k; var m = sheet.querySelector('#ygnMemo').value; ex = ex || null; draw(); sheet.querySelector('#ygnMemo').value = m; return; }
      var a = t.dataset.a, memo = sheet.querySelector('#ygnMemo').value.trim();
      if (a === 'nb') { closeSheet(); openNotebook(); return; }     // 只打开笔记本，不顺手存
      if (a === 'del') { YGN.remove(ex.id); toast('已取消标记'); }
      else if (a === 'ok') {
        var it = ex || { id: YGN.uid(), app: APP, h: h, text: text, tags: [], t: Date.now(), kind: kind };
        it.kind = kind; it.memo = memo; it.title = it.title || heading(b);
        it.path = it.path || (location.pathname + location.search + location.hash);
        if (!it.loc) { it.loc = siteLoc(); it.crumb = siteCrumb(); }
        YGN.upsert(it); toast(ex ? '已保存' : '已存入笔记本（共 ' + YGN.all().length + ' 条）');
      }
      closeSheet(); paint();
    };
    liftUi(); requestAnimationFrame(function () { sheet.classList.add('on'); });
  }

  /* ---------------- 笔记本浮层：盖在课程上，关掉后课程原样不动 ---------------- */
  var HUB = 'https://nevergiveup0618.github.io/all-project/';
  var nbBox = null, nbH = 0, nbPad = '';
  function nbMax() { return Math.round(window.innerHeight * 0.85); }
  function nbSet(h) {
    nbH = Math.max(140, Math.min(h, nbMax()));
    if (nbBox) { nbBox.style.height = nbH + 'px'; document.body.style.paddingBottom = nbH + 'px'; }
    liftUi();
  }
  function liftUi() {
    var up = nbBox ? nbH : 0, t = document.getElementById('ygnTip');
    if (t) t.style.bottom = up ? (up + 16) + 'px' : '';
    if (sheet) sheet.style.bottom = up ? up + 'px' : '';
  }
  function openNotebook() {
    if (nbBox) return;
    var frac = 0.5; try { var v = parseFloat(localStorage.getItem('yg_nbh')); if (v > 0.15 && v < 0.9) frac = v; } catch (e) {}
    nbBox = document.createElement('div'); nbBox.id = 'ygnNb';
    nbBox.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#05070f;border-top:2px solid #d9b877;box-shadow:0 -8px 28px rgba(0,0,0,.55);display:flex;flex-direction:column';
    var hd = document.createElement('div');
    hd.style.cssText = 'flex:0 0 26px;display:flex;align-items:center;justify-content:center;background:#10182c;cursor:ns-resize;touch-action:none;user-select:none;-webkit-user-select:none';
    hd.innerHTML = '<i style="display:block;width:44px;height:5px;border-radius:3px;background:rgba(217,184,119,.7)"></i>';
    hd.setAttribute('aria-label', '拖动调整笔记区高度');
    var f = document.createElement('iframe');
    f.src = HUB + 'notebook.html?embed=1&app=' + APP;
    f.title = '笔记本'; f.style.cssText = 'flex:1;width:100%;border:0;display:block;background:#05070f;min-height:0';
    nbBox.appendChild(hd); nbBox.appendChild(f); document.body.appendChild(nbBox);
    nbPad = document.body.style.paddingBottom;
    nbSet(window.innerHeight * frac);
    var sy = null, sh = 0;
    hd.addEventListener('pointerdown', function (e) { sy = e.clientY; sh = nbH; f.style.pointerEvents = 'none'; try { hd.setPointerCapture(e.pointerId); } catch (x) {} });
    hd.addEventListener('pointermove', function (e) { if (sy == null) return; nbSet(sh + (sy - e.clientY)); e.preventDefault(); });
    function up() { if (sy == null) return; sy = null; f.style.pointerEvents = ''; try { localStorage.setItem('yg_nbh', String(nbH / window.innerHeight)); } catch (x) {} }
    hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    window.addEventListener('resize', onResize);
  }
  function onResize() { if (nbBox) nbSet(nbH); }
  function closeNotebook() {
    if (!nbBox) return;
    nbBox.parentNode.removeChild(nbBox); nbBox = null;
    document.body.style.paddingBottom = nbPad;
    window.removeEventListener('resize', onResize); liftUi();
    paint();
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    var d = e.data || {}; if (!d.ygn) return;
    if (d.ygn === 'close') closeNotebook();
    else if (d.ygn === 'go') {
      if (d.app === APP) {            // 同一科目：笔记区不关，直接在上面的课程页里找并定位；找不到再提示出处
        try { localStorage.setItem('ygn_jump', JSON.stringify({ app: d.app, h: d.h, t: Date.now(), title: d.title || '' })); } catch (x) {}
        jumpDone = false; jumpAt = Date.now(); tryJump._said = 0;
        if (d.loc && window.YGN_HOOK && window.YGN_HOOK.go) { try { window.YGN_HOOK.go(d.loc); } catch (x) {} }
        var n = 0, iv = setInterval(function () { tryJump(); if (jumpDone || ++n > 14) clearInterval(iv); }, 350);
      } else {                         // 别的科目：才整页切过去
        try { localStorage.setItem('ygn_jump', JSON.stringify({ app: d.app, h: d.h, t: Date.now(), title: d.title || '', loc: d.loc || null })); } catch (x) {}
        (window.top || window).location.href = HUB + 'view.html?app=' + d.app + (d.go ? '&go=' + encodeURIComponent(d.go) : '');
      }
    }
  });

  /* ---------------- 按钮与点击拦截 ---------------- */
  function setMark(on) {
    mark = on; document.documentElement.classList.toggle('ygn-mark', on);
    var b = document.getElementById('ygnBtn'); if (b) b.classList.toggle('on', on);
    if (!on) closeSheet();
  }
  var _tip = 0;
  function build() {
    if (document.getElementById('ygnBtn')) return;
    css();
    var b = document.createElement('button');
    b.id = 'ygnBtn'; b.type = 'button'; b.textContent = '笔'; b.setAttribute('aria-label', '标记笔记');
    var drag = 0;
    b.onclick = function (e) { e.stopPropagation(); if (drag) { drag = 0; return; } setMark(!mark); };
    // 可拖动：别的按钮（如「下一章」）被挡住时自己拖开，位置记在本机
    (function () {
      var sx, sy, ox, oy, mv = 0;
      try { var p = JSON.parse(localStorage.getItem('yg_npos') || 'null'); if (p) place(p.x, p.y); } catch (e) {}
      function place(x, y) {
        var W = window.innerWidth - 40, H = window.innerHeight - 40;
        b.style.left = Math.max(4, Math.min(x, W)) + 'px'; b.style.top = Math.max(4, Math.min(y, H)) + 'px'; b.style.bottom = 'auto'; b.style.right = 'auto';
      }
      b.addEventListener('pointerdown', function (e) { var r = b.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; mv = 0; try { b.setPointerCapture(e.pointerId); } catch (x) {} });
      b.addEventListener('pointermove', function (e) {
        if (sx == null) return;
        if (!mv && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 8) return;
        mv = 1; drag = 1; place(ox + e.clientX - sx, oy + e.clientY - sy); e.preventDefault();
      });
      b.addEventListener('pointerup', function () {
        if (mv) { try { var r = b.getBoundingClientRect(); localStorage.setItem('yg_npos', JSON.stringify({ x: r.left, y: r.top })); } catch (e) {} setTimeout(function () { drag = 0; }, 60); }
        sx = null;
      });
    })();
    var tip = document.createElement('div'); tip.id = 'ygnTip';
    tip.innerHTML = '标记模式：点一段就能记 <button type="button" id="ygnTipNb" style="margin-left:8px;height:26px;padding:0 12px;border-radius:13px;border:1px solid #d9b877;background:#d9b877;color:#2a2108;font:600 12.5px sans-serif">笔记本</button>';
    tip.querySelector('#ygnTipNb').onclick = function (e) { e.stopPropagation(); if (nbBox) closeNotebook(); else openNotebook(); };
    document.body.appendChild(b); document.body.appendChild(tip);
    document.addEventListener('click', function (e) {
      if (!mark) return;
      if (e.target.closest('#ygnSh,#ygnBtn,#ygnToast')) return;
      var blk = blockOf(e.target);
      if (!blk) { closeSheet(); return; }
      e.preventDefault(); e.stopPropagation();
      openSheet(blk);
    }, true);
    try { new MutationObserver(function () { if (!busy) schedule(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    window.addEventListener('storage', function (e) { if (e.key === KEY) paint(); });
    schedule();
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
