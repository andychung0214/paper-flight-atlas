import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('static project shell exposes required entry and SEO files', () => {
  for (const file of ['index.html', 'styles.css', 'package.json']) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`);
  }
  assert.equal(existsSync(resolve(root, 'og-image.svg')), false, 'og-image.svg should not exist');

  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /<main[^>]+id="app"/);
  assert.match(html, /property="og:title"/);
  assert.ok(!html.includes('property="og:image"'));
  assert.ok(!html.includes('property="og:image:alt"'));
  assert.ok(!html.includes('name="twitter:image"'));
  assert.match(html, /application\/ld\+json/);
});
