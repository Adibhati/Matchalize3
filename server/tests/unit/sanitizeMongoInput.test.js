import assert from 'node:assert/strict';
import test from 'node:test';
import sanitizeMongoInput, { sanitizeObject } from '../../middleware/sanitizeMongoInput.js';

test('sanitizeObject removes Mongo operator and dotted keys recursively', () => {
  const input = {
    safe: 'value',
    '$where': 'malicious',
    nested: {
      'profile.name': 'malicious',
      keep: [{ '$gt': 1, score: 5 }],
    },
  };

  assert.deepEqual(sanitizeObject(input), {
    safe: 'value',
    nested: {
      keep: [{ score: 5 }],
    },
  });
});

test('middleware replaces query with a sanitized own property for Express 5', () => {
  const req = {
    body: { '$ne': null, name: 'safe' },
    query: { 'filter.$gt': 0, search: 'safe' },
  };
  let continued = false;

  sanitizeMongoInput(req, {}, () => {
    continued = true;
  });

  assert.deepEqual(req.body, { name: 'safe' });
  assert.deepEqual(req.query, { search: 'safe' });
  assert.equal(Object.hasOwn(req, 'query'), true);
  assert.equal(continued, true);
});
