/* 阅读设置：字号/行距、持久化、跨站共享键 */
const fs = require('fs'), path = require('path');
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { ({ JSDOM } = require(path.join(__dirname, '..', 'bazi-course', 'node_modules', 'jsdom'))); }
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m)); };
function load(pre) {
  const dom = new JSDOM('<!doctype html><body><p id="t">正文</p></body>', { runScripts: 'outside-only', url: 'https://x.test/' });
  if (pre) dom.window.localStorage.setItem('yg_reader', pre);
  dom.window.eval(fs.readFileSync(path.join(__dirname, 'reader.js'), 'utf8'));
  return dom.window;
}
(async () => {
  let w = load();
  const D = w.document, $ = s => D.querySelector(s);
  ok(!!$('#ygReaderBtn'), '页面出现「Aa」按钮');
  $('#ygReaderBtn').click();
  ok($('#ygReaderPop').style.display === 'block', '点按钮弹出设置面板');
  $('#ygZp').click();
  ok(D.documentElement.getAttribute('data-yg-zoom') === '110', '字号 +：zoom=1.1');
  ok(JSON.parse(w.localStorage.getItem('yg_reader')).z === 110, '设置写入 yg_reader（同域各站共享）');
  D.querySelector('[data-l="2"]').click();
  ok(/1\.95/.test((D.getElementById('yg-reader-css') || {}).textContent || ''), '行距「宽松」注入样式 1.95');
  ok(!/\.doc \*/.test(D.getElementById('yg-reader-css').textContent), '行距样式不碰 .doc * （避免撑坏命盘色牌）');
  $('#ygRst').click();
  ok(D.documentElement.getAttribute('data-yg-zoom') === '100' && !D.getElementById('yg-reader-css'), '恢复默认后无 zoom、无注入样式');
  w = load('{"z":135,"l":1}');
  ok(w.document.documentElement.getAttribute('data-yg-zoom') === '135' && !!w.document.getElementById('yg-reader-css'), '刷新后读取已存设置并生效');
  w = load('{"z":77,"l":9}');
  ok(w.document.documentElement.getAttribute('data-yg-zoom') === '100', '异常值回退默认');
  console.log(`\n${pass} 通过，${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();
