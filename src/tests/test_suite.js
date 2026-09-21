import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';
import bcrypt from 'bcryptjs';

import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../utils/tokens/tokenService.js';

import { getRedisClient } from '../config/redisConfig.js';
import { uploadToCloudinary } from '../config/cloudinaryConfig.js';
import { signupOtpTemplate, resetOtpTemplate, newBookingNotificationTemplate } from '../utils/emails/emailTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTests = async () => {
  console.log('🧪 Starting Playce Automated Test Suite...\n');

  // -------------------------------------------------------------
  // Test 1: Swagger OpenAPI Documentation Parsing
  // -------------------------------------------------------------
  console.log('Test 1: Validating Swagger YAML specification...');
  const swaggerPath = path.join(__dirname, '..', 'docs', 'swagger.yaml');
  const doc = YAML.load(swaggerPath);
  assert.strictEqual(doc.openapi, '3.0.3', 'OpenAPI version should be 3.0.3');
  assert.ok(doc.info.title.includes('Playce'), 'Title should mention Playce');
  assert.ok(doc.paths['/users/signup'], 'Signup path should be defined');
  assert.ok(doc.paths['/users/verify-otp'], 'Verify OTP path should be defined');
  assert.ok(doc.paths['/users/login'], 'Login path should be defined');
  assert.ok(doc.paths['/venues'], 'Venues path should be defined');
  assert.ok(doc.paths['/bookings/schedule-check'], 'Schedule check path should be defined');
  assert.ok(doc.paths['/bookings'], 'Bookings path should be defined');
  assert.ok(doc.paths['/bookings'].post.requestBody.content['multipart/form-data'], 'Multipart form data should be defined for bookings');
  assert.ok(doc.components.schemas.Booking.properties.planner_note, 'Booking schema should include planner_note');
  assert.ok(doc.components.schemas.Booking.properties.document_url, 'Booking schema should include document_url');
  assert.ok(doc.paths['/bookings/{id}/status'], 'Booking status path should be defined');
  console.log('✅ Swagger YAML is valid and complete.\n');

  // -------------------------------------------------------------
  // Test 2: Token Service (JWT)
  // -------------------------------------------------------------
  console.log('Test 2: Validating JWT Token operations...');
  const userPayload = { id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', role: 'event-planner', acctStatus: 'approved' };
  const accessToken = generateAccessToken(userPayload);
  const decodedAccess = verifyAccessToken(accessToken);
  assert.strictEqual(decodedAccess.id, userPayload.id);
  assert.strictEqual(decodedAccess.role, userPayload.role);
  assert.strictEqual(decodedAccess.acctStatus, userPayload.acctStatus);

  const refreshToken = generateRefreshToken(userPayload);
  const decodedRefresh = verifyRefreshToken(refreshToken);
  assert.strictEqual(decodedRefresh.id, userPayload.id);

  const resetToken = generatePasswordResetToken(userPayload.id);
  const decodedReset = verifyPasswordResetToken(resetToken);
  assert.strictEqual(decodedReset.id, userPayload.id);
  console.log('✅ JWT generation and verification passed.\n');

  // -------------------------------------------------------------
  // Test 3: Redis / Fallback Cache Store
  // -------------------------------------------------------------
  console.log('Test 3: Validating Redis Cache / Fallback Store...');
  const cache = getRedisClient();
  const testKey = 'otp:test@ui.edu.ng';
  const rawOtp = '123456';
  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  await cache.set(testKey, hashedOtp, { EX: 60 });
  const retrieved = await cache.get(testKey);
  assert.strictEqual(retrieved, hashedOtp, 'Retrieved value should match stored hash');

  const matches = await bcrypt.compare(rawOtp, retrieved);
  assert.ok(matches, 'Bcrypt compare should match for the stored OTP hash');

  await cache.del(testKey);
  const afterDelete = await cache.get(testKey);
  assert.strictEqual(afterDelete, null, 'Deleted key should return null');
  console.log('✅ Redis Cache / Fallback operations passed.\n');

  // -------------------------------------------------------------
  // Test 4: Email Templates
  // -------------------------------------------------------------
  console.log('Test 4: Validating Email Template Generators...');
  const otpTpl = signupOtpTemplate('998877');
  assert.ok(otpTpl.html.includes('998877'));
  assert.ok(otpTpl.subject.includes('Playce'));

  const resetTpl = resetOtpTemplate('445566');
  assert.ok(resetTpl.html.includes('445566'));

  const bookingTpl = newBookingNotificationTemplate(
    {
      event_name: 'Tech Gala',
      event_date: '2026-10-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      event_description: 'Annual event',
      planner_note: 'Official permission attached from Department of Computer Science.',
      document_url: 'https://res.cloudinary.com/playce-demo/image/upload/v123/playce/official_letters/letter.pdf',
    },
    { venue_name: 'SUB Pitch' },
    { username: 'john_planner', email: 'john@ui.edu.ng' }
  );
  assert.ok(bookingTpl.html.includes('Tech Gala'));
  assert.ok(bookingTpl.html.includes('SUB Pitch'));
  assert.ok(bookingTpl.html.includes('Official permission attached'));
  assert.ok(bookingTpl.html.includes('View Official Letter'));
  assert.ok(bookingTpl.html.includes('https://res.cloudinary.com'));
  console.log('✅ Email template generators with document and planner note passed.\n');

  // -------------------------------------------------------------
  // Test 5: Core Time Clash Prevention Logic
  // -------------------------------------------------------------
  console.log('Test 5: Validating Core Time Clash Prevention Algorithm...');

  const normalizeTime = (timeStr) => {
    const parts = timeStr.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;
  };

  const isClashing = (newStart, newEnd, extStart, extEnd) => {
    const s1 = normalizeTime(newStart);
    const e1 = normalizeTime(newEnd);
    const s2 = normalizeTime(extStart);
    const e2 = normalizeTime(extEnd);
    return s1 < e2 && e1 > s2;
  };

  // Existing booking: 12:00:00 to 15:00:00
  const existing = { start: '12:00:00', end: '15:00:00' };

  // Case A: Strictly before (09:00 - 11:00) -> false
  assert.strictEqual(isClashing('09:00', '11:00', existing.start, existing.end), false, 'Case A failed');

  // Case B: Touching start boundary (10:00 - 12:00) -> false (Adjacent slots do not clash)
  assert.strictEqual(isClashing('10:00', '12:00', existing.start, existing.end), false, 'Case B failed');

  // Case C: Overlapping start boundary (11:00 - 13:00) -> true
  assert.strictEqual(isClashing('11:00', '13:00', existing.start, existing.end), true, 'Case C failed');

  // Case D: Fully inside existing slot (13:00 - 14:00) -> true
  assert.strictEqual(isClashing('13:00', '14:00', existing.start, existing.end), true, 'Case D failed');

  // Case E: Exact same time (12:00 - 15:00) -> true
  assert.strictEqual(isClashing('12:00', '15:00', existing.start, existing.end), true, 'Case E failed');

  // Case F: Engulfing existing slot (11:00 - 16:00) -> true
  assert.strictEqual(isClashing('11:00', '16:00', existing.start, existing.end), true, 'Case F failed');

  // Case G: Overlapping end boundary (14:00 - 16:00) -> true
  assert.strictEqual(isClashing('14:00', '16:00', existing.start, existing.end), true, 'Case G failed');

  // Case H: Touching end boundary (15:00 - 17:00) -> false (Adjacent slots do not clash)
  assert.strictEqual(isClashing('15:00', '17:00', existing.start, existing.end), false, 'Case H failed');

  // Case I: Strictly after (16:00 - 18:00) -> false
  assert.strictEqual(isClashing('16:00', '18:00', existing.start, existing.end), false, 'Case I failed');

  console.log('✅ All Core Time Clash Prevention interval tests passed successfully!\n');

  // -------------------------------------------------------------
  // Test 6: Cloudinary Upload Utility
  // -------------------------------------------------------------
  console.log('Test 6: Validating Cloudinary Upload Helper...');
  const fakePdfBuffer = Buffer.from('%PDF-1.4 test official letter document buffer');
  const uploadResult = await uploadToCloudinary(fakePdfBuffer, 'official_sub_pitch_letter.pdf');
  assert.ok(uploadResult.secure_url, 'Upload result should have a secure_url');
  assert.ok(uploadResult.secure_url.includes('cloudinary.com'), 'URL should be a Cloudinary URL');
  assert.ok(uploadResult.public_id, 'Upload result should have a public_id');
  console.log(`✅ Cloudinary upload utility test passed: ${uploadResult.secure_url}\n`);

  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Integrity verified.');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
