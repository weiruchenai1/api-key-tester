import { vi } from 'vitest';
/**
 * Jest test suite for key processing utilities.
 * Framework: Jest (configured via package.json)
 * 
 * Tests the actual API available in keyProcessor.js
 */

import * as keyProcessor from '../utils/keyProcessor.js';

describe('Key Processing Utilities', () => {
  test('module exports expected API surface', () => {
    const expectedExports = [
      'deduplicateAndCleanKeys',
      'validateApiKey',
      'parseApiKeysText',
      'formatKeyForDisplay',
      'countKeysByStatus',
      'filterKeysByStatus',
      'exportKeysAsText',
      'generateTestReport'
    ];

    expectedExports.forEach((exportName) => {
      expect(keyProcessor).toHaveProperty(exportName);
      expect(typeof keyProcessor[exportName]).toBe('function');
    });
  });

  describe('validateApiKey', () => {
    test('rejects empty or null keys', () => {
      expect(keyProcessor.validateApiKey('', 'openai')).toEqual({
        valid: false,
        reason: 'empty'
      });
      
      expect(keyProcessor.validateApiKey(null, 'openai')).toEqual({
        valid: false,
        reason: 'empty'
      });
      
      expect(keyProcessor.validateApiKey(undefined, 'openai')).toEqual({
        valid: false,
        reason: 'empty'
      });
    });

    test('rejects non-string keys', () => {
      expect(keyProcessor.validateApiKey(123, 'openai')).toEqual({
        valid: false,
        reason: 'empty'
      });
      
      expect(keyProcessor.validateApiKey({}, 'openai')).toEqual({
        valid: false,
        reason: 'empty'
      });
    });

    test('rejects keys that are too short', () => {
      expect(keyProcessor.validateApiKey('short', 'openai')).toEqual({
        valid: false,
        reason: 'too_short'
      });
      
      expect(keyProcessor.validateApiKey('sk-short', 'openai')).toEqual({
        valid: false,
        reason: 'too_short'
      });
    });

    test('validates OpenAI keys with sk- prefix', () => {
      // gitleaks:allow (test fixture)
      const validKey = 'sk-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(validKey, 'openai')).toEqual({
        valid: true,
        key: validKey
      });
    });

    test('validates Claude keys with sk- prefix', () => {
      // gitleaks:allow (test fixture)
      const validKey = 'sk-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(validKey, 'claude')).toEqual({
        valid: true,
        key: validKey
      });
    });

    test('rejects OpenAI keys without sk- prefix', () => {
      // gitleaks:allow (test fixture)
      const invalidKey = 'ai-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(invalidKey, 'openai')).toEqual({
        valid: false,
        reason: 'invalid_format'
      });
    });

    test('validates Gemini keys with AIzaSy prefix', () => {
      // gitleaks:allow (test fixture)
      const validKey = 'AIzaSy-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(validKey, 'gemini')).toEqual({
        valid: true,
        key: validKey
      });
    });

    test('rejects Gemini keys without AIzaSy prefix', () => {
      // gitleaks:allow (test fixture)
      const invalidKey = 'gemini-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(invalidKey, 'gemini')).toEqual({
        valid: false,
        reason: 'invalid_format'
      });
    });

    test('rejects unknown API types', () => {
      const key = 'valid-key-here-with-enough-length';
      expect(keyProcessor.validateApiKey(key, 'unknown')).toEqual({
        valid: false,
        reason: 'unknown_api_type'
      });
    });

    test('trims whitespace from keys', () => {
      // gitleaks:allow (test fixture)
      const keyWithSpaces = '  sk-FAKE-' + 'a'.repeat(20) + '  ';
      const expectedKey = 'sk-FAKE-' + 'a'.repeat(20);
      expect(keyProcessor.validateApiKey(keyWithSpaces, 'openai')).toEqual({
        valid: true,
        key: expectedKey
      });
    });
  });

  describe('deduplicateAndCleanKeys', () => {
    test('removes duplicates and empty keys', () => {
      const keys = ['  key1  ', 'key2', 'key1', '', '  key3  ', 'key2', '   '];
      const result = keyProcessor.deduplicateAndCleanKeys(keys);
      
      expect(result.uniqueKeys).toEqual(['key1', 'key2', 'key3']);
      expect(result.duplicates).toEqual(['key1', 'key2']);
    });

    test('handles empty array', () => {
      const result = keyProcessor.deduplicateAndCleanKeys([]);
      expect(result.uniqueKeys).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    test('handles array with only empty strings', () => {
      const keys = ['', '   ', '\t', '\n'];
      const result = keyProcessor.deduplicateAndCleanKeys(keys);
      expect(result.uniqueKeys).toEqual([]);
      expect(result.duplicates).toEqual([]);
    });

    test('preserves order of first occurrence', () => {
      const keys = ['key3', 'key1', 'key2', 'key1', 'key3'];
      const result = keyProcessor.deduplicateAndCleanKeys(keys);
      expect(result.uniqueKeys).toEqual(['key3', 'key1', 'key2']);
    });
  });

  describe('parseApiKeysText', () => {
    test('parses multiline text into array of keys', () => {
      const text = 'key1\nkey2\n\nkey3\n  ';
      const result = keyProcessor.parseApiKeysText(text);
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    test('handles empty or invalid input', () => {
      expect(keyProcessor.parseApiKeysText('')).toEqual([]);
      expect(keyProcessor.parseApiKeysText(null)).toEqual([]);
      expect(keyProcessor.parseApiKeysText(undefined)).toEqual([]);
    });

    test('handles non-string input', () => {
      expect(keyProcessor.parseApiKeysText(123)).toEqual([]);
      expect(keyProcessor.parseApiKeysText({})).toEqual([]);
      expect(keyProcessor.parseApiKeysText([])).toEqual([]);
    });

    test('trims whitespace from each line', () => {
      const text = '  key1  \n\t key2 \t\n   key3   ';
      const result = keyProcessor.parseApiKeysText(text);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    test('filters out empty lines', () => {
      const text = 'key1\n\n\n  \nkey2\n\t\n\nkey3';
      const result = keyProcessor.parseApiKeysText(text);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('formatKeyForDisplay', () => {
    test('returns short keys unchanged', () => {
      const shortKey = 'sk-short';
      expect(keyProcessor.formatKeyForDisplay(shortKey, 20)).toBe(shortKey);
    });

    test('truncates long keys with ellipsis', () => {
      // gitleaks:allow (test fixture)
      const longKey = 'sk-FAKE-verylongkeyhere1234567890abcdef';
      const result = keyProcessor.formatKeyForDisplay(longKey, 15);
      
      expect(result.length).toBeLessThanOrEqual(15);
      expect(result).toContain('...');
      expect(result).toMatch(/^sk-.*\.\.\..*$/);
    });

    test('uses default maxLength of 20', () => {
      // gitleaks:allow (test fixture)
      const longKey = 'sk-FAKE-verylongkeyhere1234567890abcdef';
      const result = keyProcessor.formatKeyForDisplay(longKey);
      
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    test('handles empty or invalid keys', () => {
      expect(keyProcessor.formatKeyForDisplay('')).toBe('');
      expect(keyProcessor.formatKeyForDisplay(null)).toBe('');
      expect(keyProcessor.formatKeyForDisplay(undefined)).toBe('');
    });

    test('handles non-string input', () => {
      expect(keyProcessor.formatKeyForDisplay(123)).toBe('');
      expect(keyProcessor.formatKeyForDisplay({})).toBe('');
    });

    test('preserves start and end of key', () => {
      // gitleaks:allow (test fixture)
      const key = 'sk-FAKE-1234567890abcdefghijklmnop';
      const result = keyProcessor.formatKeyForDisplay(key, 15);
      
      expect(result).toMatch(/^sk-.*\.\.\..*op$/);
    });
  });

  describe('countKeysByStatus', () => {
    test('counts keys by their status', () => {
      const keyResults = [
        { status: 'valid' },
        { status: 'invalid' },
        { status: 'valid' },
        { status: 'rate-limited' },
        { status: 'testing' },
        { status: 'retrying' },
        { status: 'pending' }
      ];
      
      const counts = keyProcessor.countKeysByStatus(keyResults);
      
      expect(counts.total).toBe(7);
      expect(counts.valid).toBe(2);
      expect(counts.invalid).toBe(1);
      expect(counts.rateLimited).toBe(1);
      expect(counts.testing).toBe(1);
      expect(counts.retrying).toBe(1);
      expect(counts.pending).toBe(1);
    });

    test('handles empty array', () => {
      const counts = keyProcessor.countKeysByStatus([]);
      
      expect(counts.total).toBe(0);
      expect(counts.valid).toBe(0);
      expect(counts.invalid).toBe(0);
      expect(counts.rateLimited).toBe(0);
    });

    test('warns about unknown status', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      const keyResults = [{ status: 'unknown-status' }];
      keyProcessor.countKeysByStatus(keyResults);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown status:', 'unknown-status');
      consoleSpy.mockRestore();
    });

    test('initializes all status counts to zero', () => {
      const counts = keyProcessor.countKeysByStatus([]);
      
      expect(counts).toHaveProperty('valid', 0);
      expect(counts).toHaveProperty('invalid', 0);
      expect(counts).toHaveProperty('rateLimited', 0);
      expect(counts).toHaveProperty('testing', 0);
      expect(counts).toHaveProperty('retrying', 0);
      expect(counts).toHaveProperty('pending', 0);
    });
  });

  describe('filterKeysByStatus', () => {
    const keyResults = [
      { key: 'key1', status: 'valid' },
      { key: 'key2', status: 'invalid' },
      { key: 'key3', status: 'valid' },
      { key: 'key4', status: 'rate-limited' }
    ];

    test('filters keys by valid status', () => {
      const validKeys = keyProcessor.filterKeysByStatus(keyResults, 'valid');
      expect(validKeys).toHaveLength(2);
      expect(validKeys[0].key).toBe('key1');
      expect(validKeys[1].key).toBe('key3');
    });

    test('filters keys by invalid status', () => {
      const invalidKeys = keyProcessor.filterKeysByStatus(keyResults, 'invalid');
      expect(invalidKeys).toHaveLength(1);
      expect(invalidKeys[0].key).toBe('key2');
    });

    test('filters keys by rate-limited status', () => {
      const rateLimitedKeys = keyProcessor.filterKeysByStatus(keyResults, 'rate-limited');
      expect(rateLimitedKeys).toHaveLength(1);
      expect(rateLimitedKeys[0].key).toBe('key4');
    });

    test('returns all keys when status is "all"', () => {
      const allKeys = keyProcessor.filterKeysByStatus(keyResults, 'all');
      expect(allKeys).toHaveLength(4);
      expect(allKeys).toEqual(keyResults);
    });

    test('returns empty array for non-existent status', () => {
      const noKeys = keyProcessor.filterKeysByStatus(keyResults, 'non-existent');
      expect(noKeys).toHaveLength(0);
    });

    test('handles empty keyResults array', () => {
      const result = keyProcessor.filterKeysByStatus([], 'valid');
      expect(result).toEqual([]);
    });
  });

  describe('exportKeysAsText', () => {
    const keyResults = [
      { key: 'key1', status: 'valid' },
      { key: 'key2', status: 'invalid' },
      { key: 'key3', status: 'valid' }
    ];

    test('exports all keys by default', () => {
      const result = keyProcessor.exportKeysAsText(keyResults);
      expect(result).toBe('key1\nkey2\nkey3');
    });

    test('exports all keys when status is "all"', () => {
      const result = keyProcessor.exportKeysAsText(keyResults, 'all');
      expect(result).toBe('key1\nkey2\nkey3');
    });

    test('exports only valid keys', () => {
      const result = keyProcessor.exportKeysAsText(keyResults, 'valid');
      expect(result).toBe('key1\nkey3');
    });

    test('exports only invalid keys', () => {
      const result = keyProcessor.exportKeysAsText(keyResults, 'invalid');
      expect(result).toBe('key2');
    });

    test('returns empty string for non-existent status', () => {
      const result = keyProcessor.exportKeysAsText(keyResults, 'non-existent');
      expect(result).toBe('');
    });

    test('handles empty keyResults array', () => {
      const result = keyProcessor.exportKeysAsText([]);
      expect(result).toBe('');
    });
  });

  describe('generateTestReport', () => {
    // gitleaks:allow (test fixtures)
    const keyResults = [
      { key: 'sk-FAKE-validkey1234567890', status: 'valid', retryCount: 0 },
      { key: 'sk-FAKE-invalidkey1234567890', status: 'invalid', error: 'Invalid key', retryCount: 2 },
      { key: 'sk-FAKE-rateLimitedKey1234567890', status: 'rate-limited', retryCount: 1 }
    ];

    test('generates report with timestamp and summary', () => {
      const report = keyProcessor.generateTestReport(keyResults);
      
      expect(report).toHaveProperty('timestamp');
      expect(typeof report.timestamp).toBe('string');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');
    });

    test('includes correct summary counts', () => {
      const report = keyProcessor.generateTestReport(keyResults);
      
      expect(report.summary.total).toBe(3);
      expect(report.summary.valid).toBe(1);
      expect(report.summary.invalid).toBe(1);
      expect(report.summary.rateLimited).toBe(1);
    });

    test('formats keys for display in details', () => {
      const report = keyProcessor.generateTestReport(keyResults);
      
      expect(report.details).toHaveLength(3);
      expect(report.details[0].key).toContain('...');
      expect(report.details[0].status).toBe('valid');
      expect(report.details[1].status).toBe('invalid');
      expect(report.details[1].error).toBe('Invalid key');
    });

    test('includes retry counts in details', () => {
      const report = keyProcessor.generateTestReport(keyResults);
      
      expect(report.details[0].retryCount).toBe(0);
      expect(report.details[1].retryCount).toBe(2);
      expect(report.details[2].retryCount).toBe(1);
    });

    test('handles missing retryCount', () => {
      // gitleaks:allow (test fixture)
      const keyResultsNoRetry = [
        { key: 'sk-FAKE-test123', status: 'valid' }
      ];
      const report = keyProcessor.generateTestReport(keyResultsNoRetry);
      
      expect(report.details[0].retryCount).toBe(0);
    });

    test('handles empty keyResults array', () => {
      const report = keyProcessor.generateTestReport([]);
      
      expect(report.summary.total).toBe(0);
      expect(report.details).toEqual([]);
    });

    test('timestamp is valid ISO string', () => {
      const report = keyProcessor.generateTestReport(keyResults);
      const timestamp = new Date(report.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});