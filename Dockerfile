FROM node:12.18.3-alpine as apps-builder
LABEL maintainer="michael <micjoyce90@gmail.com>"

# RUN apt-get update && apt-get install libssl-dev -y
WORKDIR /app

COPY ./package* /app/

RUN npm config set registry http://registry.npm.taobao.org/
RUN npm install --production

FROM node:12.18.3-alpine
LABEL maintainer="michael <micjoyce90@gmail.com>"

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk update \
    && apk add --no-cache imagemagick-dev imagemagick ghostscript \
    && apk add libreoffice

ENV LANG en_GB.UTF-8
RUN apk add --update ttf-dejavu ttf-droid ttf-freefont ttf-liberation ttf-ubuntu-font-family font-isas-misc && rm -rf /var/cache/apk/*

COPY ./resource/simhei.ttf /usr/share/fonts/simhei.ttf

RUN mkdir -p /app
WORKDIR /app

COPY --from=apps-builder /app/node_modules /app/node_modules
COPY . /app

ENV PORT=3000

EXPOSE 3000
CMD [ "npm", "run", "start:docker" ]

