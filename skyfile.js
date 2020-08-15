/* global sneaky */
function taskCommonConfig() {
  this.filter = [
    '+ app**',
    '+ config**',
    '+ typings**',
    '+ app.js',
    '+ agent.js',
    '+ server.js',
    '+ package.json',
    '+ pm2**',
    '+ scripts**',
    '- **',
  ].join('\n');

  this.overwrite = true;
  this.nochdir = true;

  this.before([
    'npm run clean',
    'npm run tsc',
  ].join(' && '));
}

sneaky('release:zc3', function deploy() {
  taskCommonConfig.call(this);
  this.user = 'root';
  this.host = '64.64.240.225';
  this.port = 29579;

  this.description = 'Deploy to release';
  this.path = '/home/proxy';

  this.after([
    'npm install --production',
    'npm run stop',
    'npm run start',
  ].join(' && '));
});

sneaky('release:zc6', function deploy() {
  taskCommonConfig.call(this);
  this.user = 'root';
  this.host = '199.19.109.49';
  this.port = 29943;

  this.description = 'Deploy to release';
  this.path = '/home/proxy';

  this.after([
    'npm install --production',
    'npm run stop',
    'npm run start',
  ].join(' && '));
});
