import assert from 'node:assert/strict';
import test from 'node:test';
import Report from '../../models/Report.js';
import Analytics from '../../models/Analytics.js';

test('reporter/reported index allows multiple reports from the same pair', () => {
  const pairIndex = Report.schema.indexes().find(([keys]) =>
    keys.reporter === 1 && keys.reported === 1
  );

  assert.ok(pairIndex);
  assert.notEqual(pairIndex[1]?.unique, true);
});

test('analytics expires after 90 days and indexes user/event queries', () => {
  const indexes = Analytics.schema.indexes();
  const ttlIndex = indexes.find(([keys]) => keys.timestamp === 1);
  const userEventIndex = indexes.find(([keys]) => keys.user === 1 && keys.event === 1);

  assert.equal(ttlIndex?.[1]?.expireAfterSeconds, 90 * 24 * 60 * 60);
  assert.ok(userEventIndex);
});
