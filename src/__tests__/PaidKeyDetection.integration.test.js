/**
 * Integration test for paid key detection functionality
 * Tests the complete flow from API calls to UI display
 */

import { testGeminiKey, testGeminiPaidKey } from '../services/api/gemini';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Paid Key Detection Integration Test', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('API Layer Tests', () => {
    test('should detect paid key correctly', async () => {
      // Mock successful basic API call (200)
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Hi' }] } }]
        }))
      });

      const basicResult = await testGeminiKey('paid-test-key', 'gemini-pro', null);
      expect(basicResult.valid).toBe(true);
      expect(basicResult.responseStatus).toBe(200);

      // Mock successful Cache API call (200) - indicates paid key
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          name: 'cachedContents/test-cache'
        }))
      });

      const paidResult = await testGeminiPaidKey('paid-test-key', 'gemini-pro', null);
      expect(paidResult.isPaid).toBe(true);
      expect(paidResult.error).toBeNull();
    });

    test('should detect free key correctly', async () => {
      // Mock successful basic API call (200)
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Hi' }] } }]
        }))
      });

      const basicResult = await testGeminiKey('free-test-key', 'gemini-pro', null);
      expect(basicResult.valid).toBe(true);

      // Mock 429 Rate Limit for Cache API - indicates free key
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      const paidResult = await testGeminiPaidKey('free-test-key', 'gemini-pro', null);
      expect(paidResult.isPaid).toBe(false);
      expect(paidResult.error).toBeNull();
    });

    test('should handle invalid key correctly', async () => {
      // Mock 401 for basic API call
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const basicResult = await testGeminiKey('invalid-test-key', 'gemini-pro', null);
      expect(basicResult.valid).toBe(false);
      expect(basicResult.error).toContain('401');
    });
  });

  describe('URL Construction Tests', () => {
    test('should construct correct Cache API URL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}')
      });

      await testGeminiPaidKey('test-key', 'gemini-pro', null);

      // Verify the URL is constructed correctly
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1beta/cachedContents'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-goog-api-key': 'test-key'
          })
        })
      );
    });

    test('should handle proxy URL correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}')
      });

      const proxyUrl = 'https://proxy.example.com/';
      await testGeminiPaidKey('test-key', 'gemini-pro', proxyUrl);

      // Should use proxy URL + endpoint
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('proxy.example.com/cachedContents'),
        expect.any(Object)
      );
    });
  });
});

/**
 * Manual Test Instructions
 * 
 * To manually verify paid key detection:
 * 
 * 1. Start the application: npm start
 * 2. Navigate to the API Key Tester
 * 3. Select "Gemini" as API type
 * 4. Enable "付费检测" toggle
 * 5. Test with different key types:
 * 
 * Expected Results:
 * - Paid keys: Should show "💎 付费" status
 * - Free keys: Should show "🆓 免费" status  
 * - Invalid keys: Should show "无效" with error message
 * - Rate limited keys: Should show "速率限制" status
 * 
 * Test Cases:
 * 
 * Case 1: Paid Key Test
 * - Input: A valid paid Gemini API key
 * - Expected: Status shows "💎 付费"
 * - Verification: Key can access Cache API (returns 200)
 * 
 * Case 2: Free Key Test  
 * - Input: A valid free Gemini API key
 * - Expected: Status shows "🆓 免费"
 * - Verification: Basic API works (200) but Cache API fails (429)
 * 
 * Case 3: Invalid Key Test
 * - Input: An invalid/expired API key
 * - Expected: Status shows "无效" with error details
 * - Verification: Basic API fails (401/403)
 * 
 * Case 4: Mixed Keys Test
 * - Input: Multiple keys of different types
 * - Expected: Each key shows correct individual status
 * - Verification: Paid detection works independently for each key
 */

// Helper function to simulate worker behavior for testing
export const simulateWorkerPaidDetection = async (apiKey, config) => {
  // Step 1: Basic validation
  const basicResult = await testGeminiKey(apiKey, config.model, config.proxyUrl);
  
  if (!basicResult.valid) {
    return {
      status: basicResult.isRateLimit ? 'rate-limited' : 'invalid',
      error: basicResult.error,
      isPaid: null
    };
  }

  // Step 2: Paid detection (if enabled)
  if (config.enablePaidDetection) {
    try {
      const paidResult = await testGeminiPaidKey(apiKey, config.model, config.proxyUrl);
      
      return {
        status: paidResult.isPaid ? 'paid' : 'valid',
        error: null,
        isPaid: paidResult.isPaid
      };
    } catch (error) {
      return {
        status: 'valid',
        error: null,
        isPaid: false // Default to free on detection failure
      };
    }
  }

  return {
    status: 'valid',
    error: null,
    isPaid: null // No paid detection performed
  };
};
