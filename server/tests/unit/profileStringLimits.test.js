import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../../models/User.js';

test('profile string fields reject values longer than 50 characters', () => {
  const user = new User({
    email: 'limits@example.edu',
    gender: 'x'.repeat(51),
    intent: ['x'.repeat(51)],
    interestedIn: ['Female'],
    interests: ['x'.repeat(51)],
  });

  const error = user.validateSync();
  assert.ok(error);
  for (const field of ['gender', 'intent.0', 'interests.0']) {
    assert.ok(error.errors[field], `expected ${field} to enforce its max length`);
  }
});

test('profile string fields allow values at the 50-character limit', () => {
  const user = new User({
    email: 'limits@example.edu',
    gender: 'x'.repeat(50),
    intent: ['x'.repeat(50)],
    interestedIn: ['Female'],
    interests: ['x'.repeat(50)],
  });

  assert.equal(user.validateSync(), undefined);
});

test('interestedIn only accepts supported gender preferences', () => {
  const invalidUser = new User({
    email: 'invalid-preference@example.edu',
    interestedIn: ['Everyone', 'Unlisted value'],
  });

  assert.ok(invalidUser.validateSync()?.errors['interestedIn.1']);

  const validUser = new User({
    email: 'valid-preference@example.edu',
    interestedIn: ['Female', 'Non-binary', 'Everyone'],
  });

  assert.equal(validUser.validateSync(), undefined);
});
