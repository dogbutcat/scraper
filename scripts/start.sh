#! /bin/sh

function pend {
    while sleep 3600 && wait $!;do :;done
}

case $MODE in
    all) ./node_modules/.bin/pm2-runtime start ecosystem.config.js;;
    scraper) npm run scraper;;
    loader) npm run loader;;
esac