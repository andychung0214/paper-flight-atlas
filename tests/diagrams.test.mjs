import test from 'node:test';
import assert from 'node:assert/strict';

import { renderFoldDiagram } from '../src/diagrams.js';

test('renders accessible SVG for each supported diagram', () => {
  for (const id of [
    'crease-center',
    'fold-nose',
    'shape-wing',
    'reinforce-body',
    'finish-tip',
    'master-lock',
  ]) {
    const svg = renderFoldDiagram(id, '將紙張向中心線對摺');

    assert.match(svg, /^<svg/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-label="將紙張向中心線對摺"/);
    assert.match(svg, /viewBox=/);
    assert.doesNotMatch(svg, /<script/i);
  }
});

test('unknown diagram falls back to a safe SVG', () => {
  assert.match(renderFoldDiagram('invalid', '預設示意圖'), /aria-label="預設示意圖"/);
});

test('escapes unsafe label characters in SVG attributes', () => {
  const svg = renderFoldDiagram('crease-center', '中心線 "雙向" & <安全>');

  assert.match(svg, /aria-label="中心線 &quot;雙向&quot; &amp; &lt;安全&gt;"/);
  assert.doesNotMatch(svg, /aria-label="[^"]*<[^"]*"/);
});
