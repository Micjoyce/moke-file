# moke-file

[moke-file](https://github.com/Micjoyce/moke-file) file system using typescript && egg

## QuickStart

### Docker compose

#### Required

Install [docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/)

```bash
git clone https://github.com/Micjoyce/moke-file.git
docker-compose build
docker-compose up -d

# wait a moment
open http://localhost:3000/
```

### Development

#### Required

Install soffice

```bash
sudo curl https://gist.githubusercontent.com/pankaj28843/3ad78df6290b5ba931c1/raw/soffice.sh > /usr/local/bin/soffice && sudo chmod +x /usr/local/bin/soffice
```

Install ImageMagick

```bash
brew install imagemagick
```

```bash
npm i
npm run dev
open http://localhost:7001/
```

Don't tsc compile at development mode, if you had run `tsc` then you need to `npm run clean` before `npm run dev`.

### Deploy

```bash
npm run tsc
npm start
```

### Npm Scripts

- Use `npm run lint` to check code style
- Use `npm test` to run unit test
- se `npm run clean` to clean compiled js at development mode once

### Requirement

- Node.js 12.x
- Typescript 3.8+
