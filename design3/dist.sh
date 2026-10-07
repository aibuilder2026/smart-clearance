#!/bin/sh
# Bundle design v3 for hosting: the kit and data, every role screen, one stylesheet, and each page's own files,
# minified into dist/. The hosted pages load these from the pushed commit (jsDelivr) and images from GitHub raw.
set -e
cd "$(dirname "$0")"
./build.sh >/dev/null
rm -rf dist; mkdir -p dist
js() { npx --yes esbuild "$1" --minify --target=es2019 --charset=utf8 --legal-comments=none --line-limit=240 --log-level=warning; }
css() { npx --yes esbuild "$1" --minify --charset=utf8 --line-limit=240 --log-level=warning; }
for f in system/icons.js core/money.js core/data.js core/store.js core/flow.js system/kit.js system/world.js system/product.js; do js "$f" >> dist/sc3-core.js; echo >> dist/sc3-core.js; done
for f in screens/common.js screens/brand.js screens/trade.js screens/finance.js screens/admin.js screens/auth.js screens/roles.js; do js "$f" >> dist/sc3-screens.js; echo >> dist/sc3-screens.js; done
for f in system/tokens.css system/base.css system/components.css screens/screens.css; do css "$f" >> dist/sc3.css; echo >> dist/sc3.css; done
js system/ds.js > dist/ds.js; css system/docs.css > dist/docs.css
js demo/director.js > dist/director.js; css demo/demo.css > dist/demo.css
js app/app.js > dist/app.js; css app/app.css > dist/app.css
# the platform pages: the console carries its own mock backend; the site is the product's landing page
{ js core/platform.js; echo; js console/console.js; } > dist/console.js; css console/console.css > dist/console.css
{ js core/platform.js; echo; js site/site.js; } > dist/site.js; css site/site.css > dist/site.css
# the landing page's loader (SC-35) and the console's splash (SC-51) load on their own, first in <body>, before React
js site/loader.js > dist/loader.js
js console/splash.js > dist/console-splash.js
wc -c dist/* | tail -1
