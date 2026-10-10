/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "9fbe5ad9a82e91af95483819f09489c0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "78216cae66781e49f7d12469632fd389"
  }, {
    "url": "pwa-192x192.png",
    "revision": "4232b75675c8c77bfdd258b697cd59b1"
  }, {
    "url": "index.html",
    "revision": "17d60ed67ec01d19e9ad43bad06cfb53"
  }, {
    "url": "icon.svg",
    "revision": "f8f577acbfba6609d38cb2564ca504ee"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c0e2047b93d273d61150ccd58d8666a7"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-Dv0wU0Ot.js",
    "revision": null
  }, {
    "url": "assets/web-Dpp55U12.js",
    "revision": null
  }, {
    "url": "assets/web-Di-Q8JdT.js",
    "revision": null
  }, {
    "url": "assets/web-BU6Vhtc4.js",
    "revision": null
  }, {
    "url": "assets/web-BBPk_R22.js",
    "revision": null
  }, {
    "url": "assets/web-B7NZnG74.js",
    "revision": null
  }, {
    "url": "assets/web-0ZL_osXh.js",
    "revision": null
  }, {
    "url": "assets/vendor-three-BaI-1SrV.js",
    "revision": null
  }, {
    "url": "assets/vendor-pdf-Df_61iUK.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-DKfFWbo_.js",
    "revision": null
  }, {
    "url": "assets/st-cecilias-college-seal.jpg",
    "revision": null
  }, {
    "url": "assets/purify.es-DedTAGkB.js",
    "revision": null
  }, {
    "url": "assets/landing-building.jpg",
    "revision": null
  }, {
    "url": "assets/landing-building-3.jpg",
    "revision": null
  }, {
    "url": "assets/landing-building-2.jpg",
    "revision": null
  }, {
    "url": "assets/landing-building-1.jpg",
    "revision": null
  }, {
    "url": "assets/index.es-ClE3ONfh.js",
    "revision": null
  }, {
    "url": "assets/index-Fh7HBeUy.css",
    "revision": null
  }, {
    "url": "assets/index-DZRedsbO.js",
    "revision": null
  }, {
    "url": "assets/geist-vietnamese-wght-normal-6IgcOCM7.woff2",
    "revision": null
  }, {
    "url": "assets/geist-latin-wght-normal-BgDaEnEv.woff2",
    "revision": null
  }, {
    "url": "assets/geist-latin-ext-wght-normal-DC-KSUi6.woff2",
    "revision": null
  }, {
    "url": "assets/geist-cyrillic-wght-normal-BEAKL7Jp.woff2",
    "revision": null
  }, {
    "url": "assets/geist-cyrillic-ext-wght-normal-DjL33-gN.woff2",
    "revision": null
  }, {
    "url": "assets/default-avatar.svg",
    "revision": null
  }, {
    "url": "assets/cecilians-seal.jpg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c0e2047b93d273d61150ccd58d8666a7"
  }, {
    "url": "icon.svg",
    "revision": "f8f577acbfba6609d38cb2564ca504ee"
  }, {
    "url": "pwa-192x192.png",
    "revision": "4232b75675c8c77bfdd258b697cd59b1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "78216cae66781e49f7d12469632fd389"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9fbe5ad9a82e91af95483819f09489c0"
  }, {
    "url": "manifest.webmanifest",
    "revision": "18fc5628650e44a2809d75dbd7fb9b31"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "unsplash-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 40,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
