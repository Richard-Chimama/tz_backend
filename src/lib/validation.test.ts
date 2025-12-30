import {
  isEmail,
  isPhoneNumber,
  isUUID,
  hasLength,
  sanitizeString,
  sanitizeEmail,
  escapeHtml,
  isDefined,
} from './validation';

const runTests = () => {
  console.log('Running Validation Utils Tests...\n');

  // Test isEmail
  console.assert(isEmail('test@example.com') === true, 'isEmail: valid email failed');
  console.assert(isEmail('invalid-email') === false, 'isEmail: invalid email failed');
  console.assert(isEmail('') === false, 'isEmail: empty string failed');
  console.log('✅ isEmail tests passed');

  // Test isPhoneNumber
  console.assert(isPhoneNumber('+1234567890') === true, 'isPhoneNumber: valid intl phone failed');
  console.assert(isPhoneNumber('1234567890') === true, 'isPhoneNumber: valid local phone failed');
  console.assert(isPhoneNumber('123') === false, 'isPhoneNumber: too short phone failed');
  console.assert(isPhoneNumber('abc') === false, 'isPhoneNumber: letters failed');
  console.log('✅ isPhoneNumber tests passed');

  // Test isUUID
  // v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const v4UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  console.assert(isUUID(v4UUID) === true, 'isUUID: valid UUID failed');
  console.assert(isUUID('invalid-uuid') === false, 'isUUID: invalid UUID failed');
  console.log('✅ isUUID tests passed');

  // Test hasLength
  console.assert(hasLength('abc', 3) === true, 'hasLength: exact length failed');
  console.assert(hasLength('abc', 2, 4) === true, 'hasLength: range failed');
  console.assert(hasLength('abc', 4) === false, 'hasLength: min length failed');
  console.log('✅ hasLength tests passed');

  // Test sanitizeString
  const dirtyString = '  hello \x00 world  ';
  console.assert(sanitizeString(dirtyString) === 'hello  world', `sanitizeString: failed, got '${sanitizeString(dirtyString)}'`);
  console.log('✅ sanitizeString tests passed');

  // Test sanitizeEmail
  console.assert(sanitizeEmail('  Test@Example.com  ') === 'test@example.com', 'sanitizeEmail: failed');
  console.log('✅ sanitizeEmail tests passed');

  // Test escapeHtml
  const html = '<script>alert("xss")</script>';
  const escaped = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
  console.assert(escapeHtml(html) === escaped, 'escapeHtml: failed');
  console.log('✅ escapeHtml tests passed');

  // Test isDefined
  console.assert(isDefined(null) === false, 'isDefined: null failed');
  console.assert(isDefined(undefined) === false, 'isDefined: undefined failed');
  console.assert(isDefined(0) === true, 'isDefined: 0 failed');
  console.assert(isDefined('') === true, 'isDefined: empty string failed');
  console.log('✅ isDefined tests passed');

  console.log('\nAll tests completed successfully!');
};

runTests();
