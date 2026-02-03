const path = require('path');
const fs = require('fs');
const _ = require('lodash');

/**
 * Выполняет lodash-шаблон с доступом к require (относительно текущего файла) и _.
 * Как в hodlerexchange: в шаблоне можно писать require('./components/...').default и _.template(...).
 * Компоненты и includes читаются с диска (raw), т.к. this.require в child compiler может быть недоступен.
 */
module.exports = function (source) {
  const resourceDir = path.dirname(this.resourcePath);

  const requireInContext = (request) => {
    const fullPath = path.resolve(resourceDir, request);
    const content = fs.readFileSync(fullPath, 'utf8');
    return content;
  };

  const fn = _.template(source);
  const html = fn({
    require: (request) => {
      const content = requireInContext(request);
      return { default: content };
    },
    _: _,
  });

  return 'module.exports = ' + JSON.stringify(html);
};
