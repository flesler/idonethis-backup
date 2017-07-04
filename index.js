const fs = require('fs');
const crawler = require('./lib/crawler');
const lastDate = require('./lib/last-date');
const settings = require('./config/settings.json');

const id = process.argv[2] || Object.keys(settings.logs)[0];
if (!id) throw new Error('No id provided');

const FILE = `${settings.sources}IDoneThis-${id}.tsv`;
const EXISTED = fs.existsSync(FILE);

const stream = fs.createWriteStream(FILE, { flags: 'a' });

let startDate;
if (EXISTED) {
  startDate = lastDate.get(FILE);
} else {
  startDate = process.argv[3];
  if (!startDate) throw new Error('No startDate provided');
  stream.write('date\ttext\n');
}

crawler.start({
  id, startDate, onLine, finish,
});

const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U' };
const ACCENTS_RE = new RegExp('[' + Object.keys(ACCENTS).join('') + ']', 'g');

function onLine(date, line) {
  // Remove accents
  line = line.replace(ACCENTS_RE, noAccent);
  // Remove trailing dot
  line = line.replace(/\.$/, '');
  // Only if needed, wrap with quotes and escape quotes in the line
  if (/[\t\n"]/.test(line)) {
    line = `"${line.replace(/"/g, '""')}"`;
  }
  stream.write(date + '\t' + line + '\n');
}

function noAccent(c) {
  return ACCENTS[c];
}

function stop() {
  crawler.stop();
}

function finish() {
  stream.end();
}

process.on('SIGTERM', stop);
process.on('SIGHUP', stop);
process.on('SIGINT', stop);
process.on('beforeExit', finish);
process.on('exit', finish);
