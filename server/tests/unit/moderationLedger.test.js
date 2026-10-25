import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintModerationEmail } from '../../utils/moderationLedger.js';

test('moderation email fingerprints normalize email and never contain the email', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'unit-test-secret';

  try {
    const first = fingerprintModerationEmail(' Student@Example.edu ');
    const normalized = fingerprintModerationEmail('student@example.edu');

    assert.equal(first, normalized);
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(first.includes('student'), false);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('moderation email fingerprinting fails explicitly without the server secret', () => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    assert.throws(
      () => fingerprintModerationEmail('student@example.edu'),
      /JWT_SECRET is required/
    );
  } finally {
    if (previousSecret !== undefined) process.env.JWT_SECRET = previousSecret;
  }
});
