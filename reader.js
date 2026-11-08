/* 阅读设置（五术堂各阅读类子站共用）：字号 / 行距，同域共享，设一次所有站生效。
   用法：<script async src="https://nevergiveup0618.github.io/all-project/reader.js"></script>
   做法：字号＝整页 CSS zoom（各站字体多是 px，改根字号无效；zoom 对 WebKit/Blink/X5 都有效）；
        行距＝注入一条覆盖常见正文选择器的样式。设置存 localStorage['yg_reader']={z:字号%, l:行距档}。 */
(function () {
  if (window.__ygReader) return;
  window.__ygReader = 1;
  var KEY = 'yg_reader';
  var Z = [90, 100, 110, 120, 135, 150];
  var LH = [0, 1.75, 1.95, 2.2];                 // 0＝保持各站原样
  var LHN = ['原样', '舒适', '宽松', '很宽'];
  var st = { z: 100, l: 0 };
  try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); if (o.z) st.z = +o.z; if (o.l) st.l = +o.l; } catch (e) {}
  if (Z.indexOf(st.z) < 0) st.z = 100;
  if (st.l < 0 || st.l >= LH.length) st.l = 0;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function apply() {
    document.documentElement.style.zoom = st.z === 100 ? '' : (st.z / 100);
    document.documentElement.setAttribute('data-yg-zoom', String(st.z));
    var tag = document.getElementById('yg-reader-css');
    if (!LH[st.l]) { if (tag) tag.parentNode.removeChild(tag); return; }
    if (!tag) { tag = document.createElement('style'); tag.id = 'yg-reader-css'; (document.head || document.documentElement).appendChild(tag); }
    tag.textContent = 'p,li,blockquote,td,dd,.vp,.read-para,.lec-q p,.article p,.lesson p{line-height:' + LH[st.l] + ' !important}';
  }
  apply();

  function build() {
    if (document.getElementById('ygReaderBtn')) return;
    var b = document.createElement('button');
    b.id = 'ygReaderBtn'; b.type = 'button'; b.setAttribute('aria-label', '阅读设置');
    b.textContent = 'Aa';
    b.style.cssText = 'position:fixed;left:12px;bottom:84px;z-index:90;width:38px;height:38px;border-radius:50%;border:1px solid rgba(128,128,128,.45);' +
      'background:rgba(30,34,32,.62);color:#fff;font:600 14px/36px sans-serif;text-align:center;padding:0;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)';
    var p = document.createElement('div');
    p.id = 'ygReaderPop';
    p.style.cssText = 'position:fixed;left:12px;bottom:130px;z-index:91;display:none;min-width:210px;padding:12px 14px;border-radius:14px;' +
      'background:rgba(28,32,30,.96);color:#eee;font:13px/1.6 sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    function btn(txt, id) { return '<button type="button" id="' + id + '" style="width:36px;height:30px;border-radius:8px;border:1px solid #666;background:#2c332f;color:#fff;font-size:15px;cursor:pointer">' + txt + '</button>'; }
    function paint() {
      p.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span>字号</span><span>' + btn('A−', 'ygZm') +
        ' <b id="ygZv" style="display:inline-block;min-width:44px;text-align:center">' + st.z + '%</b> ' + btn('A+', 'ygZp') + '</span></div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between"><span>行距</span><span>' + LHN.map(function (n, i) {
          return '<button type="button" data-l="' + i + '" style="margin-left:4px;height:30px;padding:0 8px;border-radius:8px;border:1px solid ' + (i === st.l ? '#7fc3a8' : '#666') +
            ';background:' + (i === st.l ? '#2f5d4d' : '#2c332f') + ';color:#fff;font-size:12.5px;cursor:pointer">' + n + '</button>'; }).join('') + '</span></div>' +
        '<div style="margin-top:10px;text-align:right"><button type="button" id="ygRst" style="background:none;border:0;color:#9ab;text-decoration:underline;font-size:12.5px;cursor:pointer">恢复默认</button></div>';
      p.querySelector('#ygZm').onclick = function () { var i = Z.indexOf(st.z); if (i > 0) { st.z = Z[i - 1]; save(); apply(); paint(); } };
      p.querySelector('#ygZp').onclick = function () { var i = Z.indexOf(st.z); if (i < Z.length - 1) { st.z = Z[i + 1]; save(); apply(); paint(); } };
      [].forEach.call(p.querySelectorAll('[data-l]'), function (x) { x.onclick = function () { st.l = +x.getAttribute('data-l'); save(); apply(); paint(); }; });
      p.querySelector('#ygRst').onclick = function () { st.z = 100; st.l = 0; save(); apply(); paint(); };
    }
    b.onclick = function (e) { e.stopPropagation(); if (p.style.display === 'none') { paint(); p.style.display = 'block'; } else p.style.display = 'none'; };
    document.addEventListener('click', function (e) { if (p.style.display !== 'none' && !p.contains(e.target) && e.target !== b) p.style.display = 'none'; });
    document.body.appendChild(b); document.body.appendChild(p);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
