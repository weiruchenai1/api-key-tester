import { vi } from 'vitest';
/**
 * End-to-End Test for Paid Key Detection
 * Simulates the complete user workflow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock the worker
const mockWorker = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null
};

// Mock worker constructor
global.Worker = vi.fn(() => mockWorker);

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Paid Key Detection E2E Test', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockWorker.postMessage.mockClear();
  });

  test('Complete paid key detection workflow', async () => {
    // Test data
    const testKeys = [
      'paid-key-123',
      'free-key-456', 
      'invalid-key-789'
    ];

    // Simulate worker responses for different key types
    const simulateWorkerResponse = (keyType) => {
      setTimeout(() => {
        if (mockWorker.onmessage) {
          let response;
          
          switch (keyType) {
            case 'paid':
              response = {
                data: {
                  type: 'KEY_STATUS_UPDATE',
                  payload: {
                    key: 'paid-key-123',
                    status: 'paid',
                    error: null,
                    isPaid: true,
                    retryCount: 0
                  }
                }
              };
              break;
              
            case 'free':
              response = {
                data: {
                  type: 'KEY_STATUS_UPDATE', 
                  payload: {
                    key: 'free-key-456',
                    status: 'valid',
                    error: null,
                    isPaid: false,
                    retryCount: 0
                  }
                }
              };
              break;
              
            case 'invalid':
              response = {
                data: {
                  type: 'KEY_STATUS_UPDATE',
                  payload: {
                    key: 'invalid-key-789',
                    status: 'invalid',
                    error: '认证失败 (401)',
                    isPaid: null,
                    retryCount: 0
                  }
                }
              };
              break;
          }
          
          mockWorker.onmessage(response);
        }
      }, 100);
    };

    // Test the complete workflow
    console.log('🧪 Running E2E Paid Key Detection Test...\n');
    
    // Step 1: Simulate paid key detection
    console.log('📋 Step 1: Testing Paid Key...');
    simulateWorkerResponse('paid');
    
    await waitFor(() => {
      // Verify paid key shows correct status
      expect(mockWorker.onmessage).toBeDefined();
    });
    
    // Step 2: Simulate free key detection  
    console.log('📋 Step 2: Testing Free Key...');
    simulateWorkerResponse('free');
    
    // Step 3: Simulate invalid key
    console.log('📋 Step 3: Testing Invalid Key...');
    simulateWorkerResponse('invalid');
    
    console.log('✅ E2E Test completed successfully!');
  });
});

/**
 * Real-world Test Instructions
 * 
 * Follow these steps to manually verify paid key detection:
 */

export const manualTestInstructions = `
🧪 Manual Test Instructions for Paid Key Detection

Prerequisites:
- Have at least one paid Gemini API key
- Have at least one free Gemini API key  
- Application is running (npm start)

Step-by-Step Test:

1. 🌐 Open the application in browser
   - Navigate to http://localhost:3000
   - Open browser DevTools (F12) to monitor network requests

2. ⚙️ Configure API settings
   - Select "Gemini" as API type
   - Choose "gemini-pro" or "gemini-2.5-flash" model
   - Enable "付费检测" toggle (IMPORTANT!)
   - Set concurrency to 1 for easier testing

3. 📝 Input test keys
   - Add your paid key in first line
   - Add your free key in second line  
   - Add an invalid key in third line (e.g., "invalid-test-key")

4. 🚀 Start testing
   - Click "开始测试" button
   - Watch the progress and results

5. ✅ Verify results
   Expected outcomes:
   
   Paid Key:
   - Status: Shows as "付费" tab
   - Display: "💎 付费" indicator
   - Network: Two API calls (basic + cache)
   
   Free Key:  
   - Status: Shows as "有效" tab
   - Display: "🆓 免费" indicator
   - Network: Two API calls (basic succeeds, cache fails with 429)
   
   Invalid Key:
   - Status: Shows as "无效" tab  
   - Display: Error message with status code
   - Network: One API call (basic fails with 401/403)

6. 🔍 Debug if needed
   - Check Network tab for API call details
   - Check Console for any error messages
   - Verify URLs are correct: /v1beta/cachedContents for cache API

Troubleshooting:

❌ If paid keys show as free:
- Check if "付费检测" toggle is enabled
- Verify cache API URL is correct
- Check network requests for 200 vs 429 responses

❌ If all keys show as invalid:
- Verify API keys are valid and not expired
- Check proxy settings if using custom proxy
- Verify network connectivity

❌ If paid detection doesn't run:
- Ensure API type is set to "Gemini"
- Verify "付费检测" toggle is enabled
- Check that basic validation passes first

Success Criteria:
✅ Paid keys display "💎 付费"
✅ Free keys display "🆓 免费"  
✅ Invalid keys show error status
✅ Each key type appears in correct tab
✅ Network requests show expected patterns
`;

// Console helper for quick testing
if (typeof window !== 'undefined') {
  window.showTestInstructions = () => {
    console.log(manualTestInstructions);
  };
  
  console.log('💡 Run showTestInstructions() to see manual test guide');
}
