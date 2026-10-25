import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from '../src/services/apiClient.js';
import { getCurrentUser, persistSession, onAuthStateChanged } from '../src/services/session.js';

const token = (exp = Math.floor(Date.now() / 1000) + 3600) => `header.${btoa(JSON.stringify({ exp }))}.signature`;
beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  globalThis.window = new EventTarget();
});
afterEach(() => mock.restoreAll());

test('public calls use the same-origin API without a bearer token', async () => {
  persistSession({ role: 'student' }, token());
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ research: [] }));
  await apiRequest('/public/research');
  assert.equal(fetch.mock.calls[0].arguments[0], '/api/public/research');
  assert.equal(fetch.mock.calls[0].arguments[1].headers.Authorization, undefined);
});

test('authenticated requests preserve headers and serialize request options', async () => {
  const access = token();
  persistSession({ role: 'student' }, access);
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ success: true }));
  await apiRequest('/student/me', { method: 'PATCH', headers: { 'X-Test': 'value' }, body: JSON.stringify({ name: 'Student' }) }, true);
  const options = fetch.mock.calls[0].arguments[1];
  assert.equal(options.headers.Authorization, `Bearer ${access}`);
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.headers['X-Test'], 'value');
  assert.equal(options.method, 'PATCH');
});

test('401 responses clear the session and notify route guards', async () => {
  persistSession({ role: 'student' }, token());
  let user = 'unchanged';
  const unsubscribe = onAuthStateChanged((value) => { user = value; });
  mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Expired' }, { status: 401 }));
  await assert.rejects(apiRequest('/student/dashboard', {}, true), /Expired/);
  assert.equal(getCurrentUser(), null);
  assert.equal(user, null);
  unsubscribe();
});

test('an old unauthorized request cannot log out a newly signed-in user', async () => {
  persistSession({ role: 'student' }, token());
  mock.method(globalThis, 'fetch', async () => {
    persistSession({ role: 'supervisor' }, token(Math.floor(Date.now() / 1000) + 7200));
    return Response.json({ message: 'Expired' }, { status: 401 });
  });
  await assert.rejects(apiRequest('/student/dashboard', {}, true), /Expired/);
  assert.equal(getCurrentUser().role, 'supervisor');
});

test('expired and malformed sessions cannot send authenticated requests', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({}));
  persistSession({ role: 'student' }, token(1));
  assert.equal(getCurrentUser(), null);
  await assert.rejects(apiRequest('/student/dashboard', {}, true), /expired/);
  assert.equal(fetch.mock.callCount(), 0);
  localStorage.setItem('researchhub_session', '{bad json');
  assert.equal(getCurrentUser(), null);
});

test('network failures, server errors and invalid JSON provide clear errors', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network'); });
  await assert.rejects(apiRequest('/public/research'), /Unable to reach/);
  fetch.mock.mockImplementation(async () => new Response('<html>not API</html>'));
  await assert.rejects(apiRequest('/public/research'), /invalid response/);
  fetch.mock.mockImplementation(async () => Response.json({ message: 'Invalid input' }, { status: 400 }));
  await assert.rejects(apiRequest('/public/research'), /Invalid input/);
});
