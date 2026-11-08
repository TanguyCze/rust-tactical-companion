FROM node:20-alpine

WORKDIR /home/container

COPY package.json ./
COPY index.js ./
COPY public ./public

RUN mkdir -p /home/container/data

ENV SERVER_PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
