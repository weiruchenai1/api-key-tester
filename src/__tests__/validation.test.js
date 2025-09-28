/**
 * Jest test suite for validation utilities.
 * Framework: Jest (configured via package.json)
 *
 * These tests intentionally focus on the new/updated validation logic introduced in the PR diff.
 * They exercise success paths, edge cases, error conditions, sanitization behaviour, and integration-style
 * validation compositions.
 */

const validation = require('../validation');
const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

describe('Validation Utilities', () => {
  test('module exports expected public API surface', () => {
    expect(isPlainObject(validation)).toBe(true);
    const expectedExports = [
      'validateApiKey',
      'normalizeKeyInput',
      'validateEndpoint',
      'validateFeatureToggle',
      'composeValidationSummary',
      'sanitizeKeyInput',
      'getValidationError',
      'KEY_MIN_LENGTH',
      'KEY_MAX_LENGTH',
      'PREMIUM_PREFIXES'
    ];

    expectedExports.forEach((exportName) => {
      expect(validation).toHaveProperty(exportName);
    });
  });

  describe('sanitizeKeyInput', () => {
    test('trims whitespace and strips invisible characters', () => {
      const raw = ' \u200b\tabc-123\n';
      expect(validation.sanitizeKeyInput(raw)).toBe('abc-123');
    });

    test('returns empty string for falsy values', () => {
      [undefined, null, ''].forEach((input) => {
        expect(validation.sanitizeKeyInput(input)).toBe('');
      });
    });

    test('collapses internal whitespace segments', () => {
      expect(validation.sanitizeKeyInput('abc   123')).toBe('abc123');
    });
  });

  describe('normalizeKeyInput', () => {
    test('sanitizes and uppercases key', () => {
      const spy = jest.spyOn(validation, 'sanitizeKeyInput');
      const result = validation.normalizeKeyInput(' gEm-Ini 1234 ');
      expect(spy).toHaveBeenCalledWith(' gEm-Ini 1234 ');
      expect(result).toBe('GEM-INI1234');
      spy.mockRestore();
    });

    test('handles numeric input defensively', () => {
      expect(validation.normalizeKeyInput(12345)).toBe('12345');
    });

    test('guards against non-string, non-number inputs', () => {
      expect(validation.normalizeKeyInput({})).toBe('');
      expect(validation.normalizeKeyInput([])).toBe('');
    });
  });

  describe('validateApiKey', () => {
    const { validateApiKey, PREMIUM_PREFIXES, KEY_MIN_LENGTH, KEY_MAX_LENGTH } = validation;

    test('accepts keys matching premium prefixes and length bounds', () => {
      PREMIUM_PREFIXES.forEach((prefix) => {
        const base = `${prefix}${'A'.repeat(KEY_MIN_LENGTH - prefix.length)}`;
        expect(validateApiKey(base)).toEqual({
          isValid: true,
          reason: null,
          normalized: base
        });
      });
    });

    test('rejects keys shorter than minimum length', () => {
      const result = validateApiKey('ABC');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/too short/i);
    });

    test('rejects keys longer than maximum length', () => {
      const key = 'PFX'.padEnd(KEY_MAX_LENGTH + 2, 'X');
      const result = validateApiKey(key);
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/too long/i);
    });

    test('rejects keys with disallowed characters', () => {
      const result = validateApiKey('PREMIUM\!@#');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/invalid characters/i);
    });

    test('rejects keys missing premium prefix when strict mode enabled', () => {
      const result = validateApiKey('BASIC12345', { requirePremium: true });
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/premium/i);
    });

    test('allows keys missing premium prefix when strict mode disabled', () => {
      const result = validateApiKey('BASIC12345', { requirePremium: false });
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeNull();
    });

    test('normalizes before validation', () => {
      const result = validateApiKey('  premium 123 ');
      expect(result.normalized).toBe('PREMIUM123');
    });
  });

  describe('validateEndpoint', () => {
    const { validateEndpoint } = validation;

    test('accepts https endpoints by default', () => {
      const valid = validateEndpoint('https://example.com/api');
      expect(valid).toEqual({
        isValid: true,
        reason: null,
        normalized: 'https://example.com/api'
      });
    });

    test('rejects http when secure mode enforced', () => {
      const invalid = validateEndpoint('http://example.com', { forceHttps: true });
      expect(invalid.isValid).toBe(false);
      expect(invalid.reason).toMatch(/https/i);
    });

    test('rejects endpoints lacking hostname', () => {
      const invalid = validateEndpoint('/relative/path');
      expect(invalid.isValid).toBe(false);
      expect(invalid.reason).toMatch(/hostname/i);
    });

    test('rejects endpoints outside allowed host whitelist', () => {
      const invalid = validateEndpoint('https://malicious.com', {
        allowedHosts: ['safe.example.com']
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.reason).toMatch(/not whitelisted/i);
    });

    test('allows endpoints when host is whitelisted', () => {
      const valid = validateEndpoint('https://safe.example.com/service', {
        allowedHosts: ['safe.example.com', 'api.safe.example.com']
      });
      expect(valid.isValid).toBe(true);
    });
  });

  describe('validateFeatureToggle', () => {
    const { validateFeatureToggle } = validation;

    test('accepts explicit boolean toggles', () => {
      expect(validateFeatureToggle(true)).toEqual({ isValid: true, normalized: true });
      expect(validateFeatureToggle(false)).toEqual({ isValid: true, normalized: false });
    });

    test('accepts string toggles', () => {
      expect(validateFeatureToggle('true')).toEqual({ isValid: true, normalized: true });
      expect(validateFeatureToggle('FALSE')).toEqual({ isValid: true, normalized: false });
    });

    test('rejects invalid toggle representations', () => {
      const result = validateFeatureToggle('maybe');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/boolean/i);
    });

    test('applies default fallback when provided', () => {
      const result = validateFeatureToggle(undefined, { defaultValue: true });
      expect(result).toEqual({ isValid: true, normalized: true, reason: null });
    });
  });

  describe('composeValidationSummary', () => {
    const { composeValidationSummary } = validation;

    const validApiKey = { isValid: true, normalized: 'PREMIUM123', reason: null };
    const invalidEndpoint = { isValid: false, reason: 'Endpoint is not https.', normalized: '' };

    test('aggregates validation results with overall validity', () => {
      const summary = composeValidationSummary({
        apiKey: validApiKey,
        endpoint: invalidEndpoint
      });

      expect(summary.isValid).toBe(false);
      expect(summary.errors).toEqual([
        { field: 'endpoint', message: 'Endpoint is not https.' }
      ]);
      expect(summary.data.apiKey).toBe('PREMIUM123');
      expect(summary.data.endpoint).toBe('');
    });

    test('produces success summary when all validators succeed', () => {
      const summary = composeValidationSummary({
        apiKey: validApiKey,
        endpoint: { isValid: true, normalized: 'https://example.com', reason: null }
      });
      expect(summary.isValid).toBe(true);
      expect(summary.errors).toHaveLength(0);
      expect(summary.data.endpoint).toBe('https://example.com');
    });

    test('supports custom error transformer', () => {
      const summary = composeValidationSummary(
        {
          apiKey: validApiKey,
          endpoint: invalidEndpoint
        },
        {
          transformError: (field, reason) => ({ field, details: reason.toUpperCase() })
        }
      );

      expect(summary.errors).toEqual([
        { field: 'endpoint', details: 'ENDPOINT IS NOT HTTPS.' }
      ]);
    });
  });

  describe('getValidationError', () => {
    const { getValidationError } = validation;

    test('returns default message when reason unavailable', () => {
      expect(getValidationError({ isValid: false, reason: null })).toMatch(/invalid/i);
    });

    test('returns supplied reason when present', () => {
      expect(getValidationError({ isValid: false, reason: 'Too short' })).toBe('Too short');
    });

    test('handles unexpected payload values gracefully', () => {
      expect(getValidationError(null)).toMatch(/unknown/i);
      expect(getValidationError({})).toMatch(/invalid/i);
    });
  });
});