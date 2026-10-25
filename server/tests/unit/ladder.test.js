import test from 'node:test';
import assert from 'node:assert/strict';
import { bandFor, canInteract, computeScore, LADDER } from '../../utils/ladder.js';

test('required facts and matching preferences do not add profile-strength points', () => {
  assert.equal(computeScore({
    name: 'Anaya',
    gender: 'Female',
    age: 21,
    dob: new Date('2005-01-01'),
    year: 'UG',
    intent: ['Dating'],
    interestedIn: ['Male'],
    currentLatLng: { lat: 1, lng: 1 },
    pronouns: 'she/her',
    college: 'Example University',
  }), 0);
});

test('public profile content earns the configured points', () => {
  assert.equal(computeScore({ photos: ['main.jpg'] }), 25);
  assert.equal(computeScore({ bio: 'Hello', interests: ['Music'] }), 15);
  assert.equal(computeScore({
    photos: ['main.jpg', 'extra.jpg'],
    prompts: [{ question: 'Prompt?', answer: 'Answer.' }],
  }), 45);
});

test('reaction threshold can be reached without a bio', () => {
  const score = computeScore({ photos: ['main.jpg', 'extra-1.jpg', 'extra-2.jpg'] });
  assert.equal(score, LADDER.interact);
  assert.equal(canInteract(score), true);
  assert.equal(canInteract(score - 1), false);
});

test('only fully answered prompts count and content is capped at 100', () => {
  assert.equal(computeScore({ prompts: [{ question: 'Question only', answer: '' }] }), 0);
  assert.equal(computeScore({
    photos: ['main.jpg', 'extra-1.jpg', 'extra-2.jpg', 'extra-3.jpg', 'extra-4.jpg'],
    bio: 'Hello',
    prompts: [
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
      { question: 'Q3', answer: 'A3' },
      { question: 'Q4', answer: 'A4' },
    ],
    interests: ['Music'],
  }), 100);
});

test('profile strength bands use the revised reaction threshold', () => {
  assert.equal(LADDER.interact, 45);
  assert.equal(bandFor(44), 'locked');
  assert.equal(bandFor(45), 'interactable');
  assert.equal(bandFor(100), 'aspirational');
});
