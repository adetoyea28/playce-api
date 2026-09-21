import assert from 'assert';
import app from '../server.js';
import { ENV } from '../config/env.js';

const runHttpTests = async () => {
  console.log('🌐 Starting Playce HTTP Endpoint Test...\n');

  // We start app listening on a separate ephemeral test port
  const testPort = 5999;
  const server = app.listen(testPort, '127.0.0.1', async () => {
    try {
      const baseUrl = `http://127.0.0.1:${testPort}`;

      // 1. Health check
      console.log('Testing GET / (Health Check)...');
      const healthRes = await fetch(`${baseUrl}/`);
      const healthJson = await healthRes.json();
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthJson.success, true);
      assert.ok(healthJson.message.includes('Playce'));
      console.log('✅ Health check passed.');

      // 2. Swagger Docs without credentials -> 401
      console.log('Testing GET /api-docs (Unauthorized)...');
      const swaggerUnauthRes = await fetch(`${baseUrl}/api-docs/`);
      assert.strictEqual(swaggerUnauthRes.status, 401);
      console.log('✅ Basic auth challenge passed (401 received).');

      // 3. Swagger Docs with valid Basic Auth credentials -> 200
      console.log('Testing GET /api-docs/ (Authorized with Basic Auth)...');
      const credentials = Buffer.from(`${ENV.SWAGGER.USER}:${ENV.SWAGGER.PASSWORD}`).toString('base64');
      const swaggerAuthRes = await fetch(`${baseUrl}/api-docs/`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      assert.strictEqual(swaggerAuthRes.status, 200);
      const swaggerHtml = await swaggerAuthRes.text();
      assert.ok(
        swaggerHtml.includes('Playce API Documentation') || swaggerHtml.includes('swagger'),
        'Should contain Swagger UI documentation page'
      );
      console.log('✅ Swagger UI loaded with valid basic auth.');

      // 4. Validation failure on signup
      console.log('Testing POST /api/v1/users/signup with missing fields...');
      const signupInvalidRes = await fetch(`${baseUrl}/api/v1/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bademail' }),
      });
      const signupInvalidJson = await signupInvalidRes.json();
      assert.strictEqual(signupInvalidRes.status, 400);
      assert.strictEqual(signupInvalidJson.success, false);
      assert.ok(signupInvalidJson.errors.length > 0);
      console.log('✅ Validation error handling passed (400 returned with detailed field errors).');

      // 5. 404 Route handler
      console.log('Testing GET /api/v1/non-existent-route...');
      const notFoundRes = await fetch(`${baseUrl}/api/v1/non-existent-route`);
      const notFoundJson = await notFoundRes.json();
      assert.strictEqual(notFoundRes.status, 404);
      assert.strictEqual(notFoundJson.success, false);
      console.log('✅ 404 Not Found handling passed.');

      console.log('\n🎉 ALL HTTP TESTS PASSED SUCCESSFULLY!');
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
    } catch (err) {
      console.error('❌ HTTP Test Failed:', err);
      process.exit(1);
    }
  });
};

runHttpTests();
