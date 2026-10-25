const sanitizeObject = (value) => {
  if (!value || typeof value !== 'object') return value;

  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      for (const item of current) {
        if (item && typeof item === 'object') pending.push(item);
      }
      continue;
    }

    for (const key of Object.keys(current)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete current[key];
      } else if (current[key] && typeof current[key] === 'object') {
        pending.push(current[key]);
      }
    }
  }

  return value;
};

const sanitizeMongoInput = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.headers = sanitizeObject(req.headers);
  Object.defineProperty(req, 'query', {
    configurable: true,
    enumerable: true,
    value: sanitizeObject(req.query),
    writable: true,
  });
  next();
};

export { sanitizeObject };
export default sanitizeMongoInput;
