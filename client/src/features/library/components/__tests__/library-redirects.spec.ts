// Unit tests validating next.config.ts redirect configurations for library routes.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import nextConfig from '../../../../../next.config';

describe('next.config.ts library redirects', () => {
  it('defines redirects for /library, /library/subject, and /library/room', async () => {
    assert.ok(typeof nextConfig.redirects === 'function');
    const redirects = await nextConfig.redirects();

    const libRedirect = redirects.find((r) => r.source === '/library');
    assert.ok(libRedirect);
    assert.strictEqual(libRedirect.destination, '/library/faculty');
    assert.strictEqual(libRedirect.permanent, false);

    const subjectRedirect = redirects.find((r) => r.source === '/library/subject');
    assert.ok(subjectRedirect);
    assert.strictEqual(subjectRedirect.destination, '/library/subjects');
    assert.strictEqual(subjectRedirect.permanent, true);

    const roomRedirect = redirects.find((r) => r.source === '/library/room');
    assert.ok(roomRedirect);
    assert.strictEqual(roomRedirect.destination, '/library/rooms');
    assert.strictEqual(roomRedirect.permanent, true);
  });
});
