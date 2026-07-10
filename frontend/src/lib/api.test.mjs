import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApiUrl } from './api.js';

test('buildApiUrl prefixes the configured backend origin', () => {
  assert.equal(buildApiUrl('/api/posts'), 'http://localhost:3000/api/posts');
});

test('buildApiUrl preserves absolute URLs', () => {
  assert.equal(buildApiUrl('https://example.com/api/posts'), 'https://example.com/api/posts');
});
