const Spider = require('node-spider');
const settings = require('../config/settings.json');

const ONE_DAY = 24 * 60 * 60 * 1000;
const END = dateToString(new Date());

const spider = new Spider({
  concurrent: 1,
  delay: settings.delay,
  addReferrer: true,
  error,
  keepAlive: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:49.0) Gecko/20100101 Firefox/49.0',
    Cookie: '_idonethis_session=' + settings.session,
  },
});

function dateToString(date) {
  return date.toISOString().slice(0, 10);
}

function makeURL(id, date) {
  return `https://beta.idonethis.com/t/${id}?date=${date}`;
}

function error(err, url) {
  console.error('ERROR:', url, '>', err.stack);
  process.exit(1);
}

exports.start = (data) => {
  data.date = new Date(data.startDate);
  fetch(data);
};

let stopped = false;

exports.stop = () => {
  stopped = true;
};

function fetch(data) {
  data.date = new Date(data.date.getTime() + ONE_DAY);
  data.sdate = dateToString(data.date);

  if (stopped || data.sdate === END) {
    return data.finish();
  }

  const url = makeURL(data.id, data.sdate);
  console.log('Fetching', url);
  spider.queue(url, onResponse.bind(null, data));
}

function onResponse(data, doc) {
  doc.$('div.editable.entry-body').each((i, elem) => {
    getLines(doc.$(elem).text(), (line) => {
      data.onLine(data.sdate, line);
    });
  });

  fetch(data);
}

const CLEAN = /^\[[ x]] /;

function getLines(lines, done) {
  const map = {};
  lines.split(/[\r\n]+/).forEach((line) => {
    let text = line.trim();
    if (settings.cleanDones) {
      text = text.replace(CLEAN, '');
    }
    if (text && !map[text]) {
      map[text] = true;
      done(text);
    }
  });
}
