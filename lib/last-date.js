const fs = require('fs');

exports.get = function (file) {
  return fs.readFileSync(file, 'utf8').trim()
    .split('\n').pop()
    .slice(0, 10);
};
