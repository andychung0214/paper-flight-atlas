import test from 'node:test';
import assert from 'node:assert/strict';
import { planes, getDifficultySummary, getPlaneById } from '../src/data/planes.js';

test('catalog contains eight planes across four difficulties', () => {
  assert.equal(planes.length, 8);
  assert.deepEqual(getDifficultySummary().map(item => item.count), [2, 2, 2, 2]);
  assert.equal(new Set(planes.map(plane => plane.id)).size, 8);
});

test('every plane has detailed folding steps', () => {
  for (const plane of planes) {
    assert.ok(plane.summary.length > 20);
    assert.ok(plane.materials.length >= 2);
    assert.ok(plane.steps.length >= 5);
    for (const step of plane.steps) {
      for (const key of ['title', 'instruction', 'tip', 'commonMistake', 'diagram']) {
        assert.equal(typeof step[key], 'string');
        assert.ok(step[key].length > 0);
      }
    }
  }
});

test('lookup returns a plane and undefined for unknown id', () => {
  assert.equal(getPlaneById('sky-arrow').name, 'Sky Arrow');
  assert.equal(getPlaneById('unknown-plane'), undefined);
});
