FROM node:10-alpine

ADD . /scraper
WORKDIR /scraper

RUN npm install --production

EXPOSE 6881/udp
ENV MODE=all

# CMD ["/usr/local/bin/pm2-runtime", "start", "ecosystem.config.js"]
ENTRYPOINT [ "scripts/start.sh" ]
