const getFieldValue = (req, field) => {
  if (!req.body || typeof req.body !== 'object') return undefined;
  return req.body[field];
};

const isOptionalSkip = (value, options = {}) => {
  if (value === undefined || value === null) return true;
  if (options.nullable === true && value === null) return true;
  if (options.checkFalsy && (value === '' || value === false || value === 0 || value.length === 0)) return true;
  return false;
};

const runRule = (value, rule) => {
  const { type, options, pattern, fn } = rule;

  switch (type) {
    case 'notEmpty':
      return value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);
    case 'isEmail':
      return typeof value === 'string' && /.+@.+\..+/.test(value);
    case 'isInt': {
      if (typeof value !== 'number' || !Number.isInteger(value)) return false;
      const { min, max } = options || {};
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
      return true;
    }
    case 'isLength': {
      if (typeof value !== 'string') return false;
      const { min, max } = options || {};
      if (min !== undefined && value.length < min) return false;
      if (max !== undefined && value.length > max) return false;
      return true;
    }
    case 'matches':
      return typeof value === 'string' && pattern instanceof RegExp ? pattern.test(value) : false;
    case 'custom':
      try {
        return fn(value);
      } catch {
        return false;
      }
    default:
      return true;
  }
};

export const body = (field) => {
  const rules = [];
  let lastRule = null;

  const chain = {
    optional(options = {}) {
      lastRule = { type: 'optional', options };
      rules.push(lastRule);
      return chain;
    },
    notEmpty() {
      lastRule = { type: 'notEmpty' };
      rules.push(lastRule);
      return chain;
    },
    isEmail() {
      lastRule = { type: 'isEmail' };
      rules.push(lastRule);
      return chain;
    },
    isInt(options = {}) {
      lastRule = { type: 'isInt', options };
      rules.push(lastRule);
      return chain;
    },
    isLength(options = {}) {
      lastRule = { type: 'isLength', options };
      rules.push(lastRule);
      return chain;
    },
    matches(pattern) {
      lastRule = { type: 'matches', pattern };
      rules.push(lastRule);
      return chain;
    },
    custom(fn) {
      lastRule = { type: 'custom', fn };
      rules.push(lastRule);
      return chain;
    },
    withMessage(message) {
      if (lastRule) {
        lastRule.message = message;
      }
      return chain;
    },
  };

  return (req, _res, next) => {
    req.__validationRules ??= [];
    req.__validationRules.push({ field, rules });
    next();
  };
};

export const validate = (req, res, next) => {
  const validationRules = req.__validationRules || [];
  const errors = [];

  for (const { field, rules } of validationRules) {
    const value = getFieldValue(req, field);

    for (const rule of rules) {
      if (rule.type === 'optional' && isOptionalSkip(value, rule.options)) {
        continue;
      }

      if (!runRule(value, rule)) {
        errors.push({ field, message: rule.message || 'Validation failed' });
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};
