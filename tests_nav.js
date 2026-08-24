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
    // 风水：STAT 里一度根本没有 fengshui，卡片永远空白
    w.localStorage.setItem('guanshan_read', JSON.stringify({ 'A#1': 1, 'A#2': 1, 'B#1': 1 }));
    w.localStorage.setItem('guanshan_srs', JSON.stringify({ k1: {}, k2: {}, k3: {}, k4: {} }));
    // 八字日练
    w.localStorage.setItem('bazi_cat_stats', JSON.stringify({ 财: { a: 20, e: 4 } }));
    // ⚠️ 陈旧缓存：App 曾在数据没读出来时汇报过这句，被永久钉住
    w.localStorage.setItem('yst_stat_bazi', JSON.stringify({ text: '尚未开始练习', at: 1 }));
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

  console.log('\n== 看板读的是实时数据，不是陈旧缓存 ==');
  {
    const fs = d.querySelector('.card[data-app="fengshui"] .badge');
    ok(/读完 <b>3<\/b> 篇/.test(fs.innerHTML) && /知识点 <b>4<\/b> 条/.test(fs.innerHTML),
       '风水卡显示进度（STAT 里一度漏了 fengshui，从来没显示过）');
    const bz = d.querySelector('.card[data-app="bazi"] .badge');
    // yst_stat_bazi 里钉着「尚未开始练习」，实时算得出来就必须盖过它
    ok(/已练 <b>20<\/b> 题/.test(bz.innerHTML),
       '八字日练显示实时的 20 题，没被陈旧缓存「尚未开始练习」顶掉');
    // ⚠️ 只查 badge：整页 innerHTML 会扫到 <script> 里的注释，那不算显示出来
    const badges = [...d.querySelectorAll('.card .badge')].map(b => b.innerHTML).join('|');
    ok(!/尚未|暂无|还没/.test(badges), '徽章里不出现「尚未开始」这类占位文本');
  }

  console.log('\n== 两处 App 名一致 ==');
  const names = [...html.matchAll(/(\w+):'([^']+)'/g)].filter(m => keys.includes(m[1]));
  ok(names.length === 8, 'index.html 的 NAMES 覆盖 8 个 App');
  ok(names.every(m => new RegExp(m[1] + '\\s*:\\s*\\{u:').test(view)), 'view.html 的 APP 表也都有');

  console.log('\n== 进度备份 ==');
  {
    const fs2 = require('fs'), path2 = require('path');
    const bh = fs2.readFileSync(path2.join(__dirname, 'backup.html'), 'utf8');
    ok(/backup\.html/.test(html), '导航页有备份入口');
    // ⚠️ 看板缓存不能进备份：带到新设备会把旧文本钉住，正是这次要修的毛病
    ok(/yst_stat_/.test(bh) && /SKIP/.test(bh), '备份排除了 yst_stat_ 看板缓存');
    ok(/yishutang-backup/.test(bh), '备份文件带类型标记，能挡住别家的 json');
    ok(/window\.confirm/.test(bh), '覆盖前要用户确认（恢复不可逆）');
    // 真跑一遍：甲机导出 → 乙机导入
    const { JSDOM: J2 } = require('jsdom');
    const A = new J2(bh, { runScripts: 'dangerously', url: 'https://x.io/a/backup.html',
      beforeParse(w) { w.localStorage.setItem('bazi_cat_stats', JSON.stringify({ 财: { a: 20 } })); } });
    setTimeout(() => {
      A.window.document.getElementById('gen').click();
      const bak = A.window.document.getElementById('out').value;
      const B = new J2(bh, { runScripts: 'dangerously', url: 'https://x.io/b/backup.html' });
      setTimeout(() => {
        const w = B.window, doc = w.document;
        w.confirm = () => true;
        doc.getElementById('in').value = bak;
        doc.getElementById('imp').click();
        ok(w.localStorage.getItem('bazi_cat_stats') === JSON.stringify({ 财: { a: 20 } }),
           '导出→导入后数据一致（跨设备恢复走得通）');
        doc.getElementById('in').value = '不是备份';
        doc.getElementById('imp').click();
        ok(/读不出来/.test(doc.getElementById('m2').textContent), '乱粘贴会被挡下');
        // ⚠️ 截断是微信里最常见的失败，必须点名报出来而不是笼统说"不是备份"
        doc.getElementById('in').value = bak.slice(0, 40);
        doc.getElementById('imp').click();
        ok(/截断/.test(doc.getElementById('m2').textContent), '被截断时明确指出是截断');
        // 粘贴常带的杂质：前后多余的话、中文引号、零宽字符——都该自动洗掉
        doc.getElementById('in').value = '我的备份：' + bak.replace(/"/g, '\u201d') + ' 以上';
        doc.getElementById('imp').click();
        ok(/已恢复/.test(doc.getElementById('m2').textContent), '带杂质的粘贴能自动清洗');

        // ⚠️ 恢复链接的往返（gzip／分片／乱序拼合）放在 tests_backup.js 测——
        //    那条路是异步的（要等 CompressionStream 压缩完），塞在这里只会把本文件搞乱。
        ok(/id="link"/.test(bh), '有「生成恢复链接」按钮');
        ok(/CompressionStream/.test(bh), '链接走 gzip 压缩（不压缩塞不下）');
        ok(/FRAG/.test(bh), '超长会切成多条链接');
        console.log(`\n${fail ? '✗' : '✓'} 通过 ${pass} 项，失败 ${fail} 项`);
        process.exit(fail ? 1 : 0);
      }, 250);
    }, 250);
    return;
  }

  console.log(`\n${fail ? '✗' : '✓'} 通过 ${pass} 项，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
}, 300);
