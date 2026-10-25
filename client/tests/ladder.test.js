import test from 'node:test';
import assert from 'node:assert/strict';
import { getScoreOpportunities, readLadder } from '../src/utils/ladder.js';

test('opportunities include missing content with server-configured point values', () => {
  const user = {
    profileScore: 25,
    photos: ['main.jpg'],
    bio: '',
    prompts: [{ question: 'Prompt?', answer: 'Answered.' }],
    interests: ['Music'],
  };
  const config = {
    ladder: {
      interact: 45,
      weights: {
        mainPhoto: 25,
        additionalPhoto: 10,
        bio: 10,
        answeredPrompt: 10,
        interests: 5,
      },
      maxPhotos: 4,
      maxPrompts: 3,
    },
  };

  const opportunities = getScoreOpportunities(user, config);
  assert.deepEqual(
    opportunities.map(({ key, points }) => [key, points]),
    [
      ['photo-1', 10],
      ['photo-2', 10],
      ['photo-3', 10],
      ['bio', 10],
      ['prompt-1', 10],
      ['prompt-2', 10],
    ],
  );
  assert.equal(readLadder(config).interact, 45);
  assert.equal(user.profileScore, 25);
});

test('missing main photo and interests are presented as personalized opportunities', () => {
  const opportunities = getScoreOpportunities({
    photos: [],
    prompts: [],
    interests: [],
  });

  assert.ok(opportunities.some((item) => item.key === 'main-photo' && item.points === 25));
  assert.ok(opportunities.some((item) => item.key === 'interests' && item.points === 5));
});

test('answered prompts are not suggested and custom server caps are respected', () => {
  const opportunities = getScoreOpportunities({
    photos: ['main.jpg', 'extra.jpg'],
    prompts: [{ question: 'Q', answer: 'A' }],
    bio: 'About me',
    interests: ['Music'],
  }, {
    ladder: { maxPhotos: 2, maxPrompts: 1 },
  });

  assert.equal(opportunities.length, 0);
});
