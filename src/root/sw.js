const CACHE_NAME = 'cache-v-1';
const staticRes = [
  '/',
  './index.html',
  './index.js',
  './sw.js',
  './manifest.json',
  './res/icon.png',
  './res/1.png',
  './res/2.png',
  './css/main.css',
]
self.addEventListener('install', async (e) => {
  // 缓存静态资源
  await (await caches.open(CACHE_NAME)).addAll(staticRes);
  await self.skipWaiting();
})
self.addEventListener('activate', async (e) => {
  // 删除旧的资源
  (await caches.keys()).forEach(k => {
    if (k !== CACHE_NAME) {
      caches.delete(k);
    }
  });
  await self.clients.claim();
})

self.addEventListener("fetch", async (event) => {
  // 给浏览器响应
  event.respondWith(networkFirst(event.request))

})

// 网络优先
async function networkFirst(req) {
  try {
    let response = await self.fetch(req);

    //加入缓存
    let r = response.clone();
    (await caches.open(CACHE_NAME)).put(req, r);

    log1('fetch: ', req.url)
    return response
  } catch (e) {
    logErr('fetch error: ', req.url)
    let res = await (await caches.open(CACHE_NAME)).match(req);
    if (res) {
      log1('caches: ', req.url)
    } else {
      logErr('caches error: ', req.url)
    }
    return res
  }
}

// 缓存优先
async function cacheFirst(req) {
  return await (await caches.open(CACHE_NAME)).match(req)
    // 缓存查找错误
    .catch(function () {
      log1('try fetch: ', req.url)
      return self.fetch(req);
    })
    .then(response => {
      if (response) {
        // 缓存有效
        log1('cache: ', req.url)
        return response;
      }
      log1('try fetch: ', req.url)
      return self.fetch(req);
    })
    .then(r => {
      // fetch成功和缓存读取成功，都会来到这里，每次都重新加入缓存
      logErr('fetch or cache error', req.url);
      (async (r_) => {
        await (await caches.open(CACHE_NAME)).put(req, r_);
      })(r.clone());
      return r;
    })
    .catch((err) => {
      // 只有self.fetch(req)失败才会到这里
      logErr('fetch error', req.url, err)
      return undefined
    })

}


function log1(title, ...arr) {
  //trace
  console.log('%c ' + title, 'color:yellow;background-color:#3d09de;', ...arr);
}

function logErr(title, ...arr) {
  //trace
  console.log('%c ' + title, 'color:yellow;background-color:red;', ...arr);
}