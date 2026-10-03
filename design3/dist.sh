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
for f in screens/common.js screens/brand.js screens/trade.js screens/finance.js screens/admin.js screens/roles.js; do js "$f" >> dist/sc3-screens.js; echo >> dist/sc3-screens.js; done
for f in system/tokens.css system/base.css system/components.css screens/screens.css; do css "$f" >> dist/sc3.css; echo >> dist/sc3.css; done
js system/ds.js > dist/ds.js; css system/docs.css > dist/docs.css
js demo/director.js > dist/director.js; css demo/demo.css > dist/demo.css
js app/app.js > dist/app.js; css app/app.css > dist/app.css
wc -c dist/* | tail -1
