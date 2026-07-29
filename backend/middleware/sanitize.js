const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (obj) => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(v => sanitize(v));
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitize(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

module.exports = sanitizeMiddleware;
