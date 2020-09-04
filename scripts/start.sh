#! /bin/sh

function pend {
    while sleep 3600 && wait $!;do :;done
}

case $MODE in
    all) ./node_modules/.bin/pm2-runtime start all.js;;
    scraper) npm run scraper;;
    loader) npm run loader;;
    tracker) npm run tracker;;
esac