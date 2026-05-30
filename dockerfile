FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    chromium \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY . .
RUN npm install
RUN pip3 install discord.py

EXPOSE 7860
# CMD node -e "require('http').createServer((_,r)=>r.end('ok')).listen(7860)" & node crackbot.js

CMD node keepalive.js & node crackbot.js