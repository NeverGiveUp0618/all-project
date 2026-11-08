/* 进度守护（2026-11-04）——起因：用户在微信里刷了 4000 多道题，退出微信再打开，整个站点的 localStorage 被清空。
   纯静态站没有服务器，能做的是三层：
   ① 申请「持久存储」，降低被浏览器主动回收的概率；
   ② 把本域所有学习进度（除缓存类键）镜像进 IndexedDB——只增不减、从不覆盖更新的数据；
      启动时若发现 localStorage 缺键而镜像里有，就自动补回（只补缺的，不覆盖现有）；
   ③ 备份提醒（首页横幅）——真正抗得住「整域被清」的只有导出到微信聊天/文件里的备份。
   同域（nevergiveup0618.github.io）下所有项目共用 localStorage，所以一份 guard.js 管全部。
   用法：<script src=".../all-project/guard.js"></script>；加 ?reload=1 时（直开子站）补回后自动刷新一次。
   对外：window.YG = {ready: Promise<restoredCount>, snapshot(), lastExport(), markExport()} */
(function () {
  'use strict';
  var SKIP = /^(yst_stat_|wst_last$|wst_usage$|yg_)/;     // 与 backup.html 的 SKIP 同口径，另加本模块自己的键
  var DB = 'yg_guard', ST = 'snap', KEY = 'latest';
  var me = document.currentScript && document.currentScript.src || '';
  var wantReload = /[?&]reload=1/.test(me);

  function openDB() {
    return new Promise(function (ok, no) {
      try {
        var r = indexedDB.open(DB, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { no(r.error); };
      } catch (e) { no(e); }
    });
  }
  function getSnap() {
    return openDB().then(function (db) {
      return new Promise(function (ok) {
        var q = db.transaction(ST, 'readonly').objectStore(ST).get(KEY);
        q.onsuccess = function () { ok(q.result || null); };
        q.onerror = function () { ok(null); };
      });
    }).catch(function () { return null; });
  }
  function putSnap(obj) {
    return openDB().then(function (db) {
      return new Promise(function (ok) {
        var tx = db.transaction(ST, 'readwrite');
        tx.objectStore(ST).put(obj, KEY);
        tx.oncomplete = function () { ok(true); };
        tx.onerror = function () { ok(false); };
      });
    }).catch(function () { return false; });
  }
  function localAll() {
    var o = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && !SKIP.test(k)) o[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return o;
  }

  // 镜像：以「已有镜像」为底，用当前 localStorage 覆盖同名键；绝不因为 localStorage 变少而删镜像
  function snapshot() {
    return getSnap().then(function (old) {
      var data = (old && old.data) || {}, cur = localAll(), k, n = 0;
      for (k in cur) { if (data[k] !== cur[k]) { data[k] = cur[k]; n++; } }
      if (!n && old) return false;
      return putSnap({ at: Date.now(), data: data });
    });
  }

  // 补回：只补 localStorage 里没有的键
  function restore() {
    return getSnap().then(function (s) {
      if (!s || !s.data) return 0;
      var n = 0, k;
      for (k in s.data) {
        try {
          if (localStorage.getItem(k) === null) { localStorage.setItem(k, s.data[k]); n++; }
        } catch (e) {}
      }
      return n;
    });
  }

  function toast(msg) {
    try {
      var d = document.createElement('div');
      d.textContent = msg;
      d.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99999;background:#1f2a1f;color:#cfe8c9;' +
        'border:1px solid #4c7a4c;border-radius:10px;padding:9px 14px;font:13px/1.5 sans-serif;max-width:86vw;text-align:center';
      (document.body || document.documentElement).appendChild(d);
      setTimeout(function () { d.remove(); }, 6000);
    } catch (e) {}
  }

  // ① 持久存储
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  var ready = restore().then(function (n) {
    if (n > 0) {
      try { localStorage.setItem('yg_restored', JSON.stringify({ at: Date.now(), n: n })); } catch (e) {}
      if (wantReload) {
        var f = 'yg_reloaded';
        try { if (!sessionStorage.getItem(f)) { sessionStorage.setItem(f, '1'); location.reload(); return n; } } catch (e) {}
      }
      toast('已从本机镜像找回 ' + n + ' 项学习进度');
    }
    return n;
  }).catch(function () { return 0; });

  // ② 镜像时机：启动后、每 20 秒、切后台/关页
  ready.then(function () { snapshot(); setInterval(snapshot, 20000); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') snapshot(); });
  window.addEventListener('pagehide', function () { snapshot(); });

  // ③ 备份时间戳（backup.html 导出时写；首页横幅读）
  function markExport() { try { localStorage.setItem('yg_export', String(Date.now())); } catch (e) {} }
  function lastExport() { try { return +localStorage.getItem('yg_export') || 0; } catch (e) { return 0; } }

  // ④ 备份提示（2026-11-06）：在子站里学了 3 分钟、且 15 天没导出过（2026-11-08 由 3 天改为 15 天） → 底部弹一条（每天最多一次；首页有自己的横幅，不重复）
  function nudge(force) {
    try {
      if (document.getElementById('ygBar') || document.getElementById('ygNudge')) return false;
      var day = Math.floor(Date.now() / 864e5), last = lastExport();
      if (!force) {
        if (last && Date.now() - last < 15 * 864e5) return false;
        if (+localStorage.getItem('yg_nudge') === day) return false;
        if (!Object.keys(localAll()).length) return false;
      }
      localStorage.setItem('yg_nudge', String(day));
      var d = document.createElement('div'); d.id = 'ygNudge';
      d.style.cssText = 'position:fixed;left:10px;right:10px;bottom:12px;z-index:99998;background:#3a2a12;color:#ffe2b0;border:1px solid #b9812c;border-radius:12px;padding:10px 12px;font:13px/1.5 sans-serif;display:flex;gap:10px;align-items:center;box-shadow:0 4px 18px rgba(0,0,0,.4)';
      var days = last ? Math.floor((Date.now() - last) / 864e5) + ' 天没' : '还没';
      d.innerHTML = '<span style="flex:1">学习进度' + days + '备份了。微信一清存储就可能全丢，花 10 秒导出一份吧。</span>' +
        '<a href="https://nevergiveup0618.github.io/all-project/backup.html" style="color:#1b1304;background:#e0a94a;border-radius:8px;padding:6px 10px;text-decoration:none;white-space:nowrap">去备份</a>' +
        '<a href="#" style="color:#c9a66b;text-decoration:none">稍后</a>';
      d.lastChild.onclick = function (e) { e.preventDefault(); d.remove(); };
      (document.body || document.documentElement).appendChild(d);
      return true;
    } catch (e) { return false; }
  }
  if (!/\/all-project\//.test(location.pathname)) setTimeout(function () { nudge(false); }, 180000);

  window.YG = { nudge: nudge, ready: ready, snapshot: snapshot, restore: restore, markExport: markExport, lastExport: lastExport };
})();
