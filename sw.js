const CACHE = 'mingli-home-v21-restorelink';
const ASSETS = ['./', './index.html', './view.html', './manifest.json',
                './icon180.png', './icon192.png', './icon512.png',
                './backup.html', './check.html'];

self.addEventListener('install', e => {
  // ⚠️ addAll 必须兜底：任何一个资源取不到都会让 install 失败，
  //    浏览器随后反复重试安装，是无限刷新的另一条可能路径（其余几个站早已加了 catch）。
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS)).catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 网络优先:总是先取最新,失败(离线)才回退缓存
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
