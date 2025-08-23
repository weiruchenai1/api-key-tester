/**
 * Manual Test Script for Paid Key Detection
 * Run this in browser console to test paid key functionality
 */

// Test configuration
const TEST_CONFIG = {
  // Replace with actual test keys
  PAID_KEY: 'your-paid-gemini-key-here',
  FREE_KEY: 'your-free-gemini-key-here', 
  INVALID_KEY: 'invalid-key-12345',
  MODEL: 'gemini-pro',
  PROXY_URL: null // or your proxy URL
};

/**
 * Manual Test Function - Run in Browser Console
 * 
 * Instructions:
 * 1. Open browser dev tools (F12)
 * 2. Navigate to Console tab
 * 3. Copy and paste this entire script
 * 4. Update TEST_CONFIG with your actual API keys
 * 5. Run: await runPaidKeyDetectionTest()
 */
window.runPaidKeyDetectionTest = async function() {
  console.log('🧪 Starting Paid Key Detection Test...\n');
  
  // Import the API functions (adjust path as needed)
  const { testGeminiKey, testGeminiPaidKey } = await import('../services/api/gemini.js');
  
  const results = [];
  
  // Test 1: Paid Key
  console.log('📋 Test 1: Testing Paid Key...');
  try {
    const basicResult = await testGeminiKey(TEST_CONFIG.PAID_KEY, TEST_CONFIG.MODEL, TEST_CONFIG.PROXY_URL);
    console.log('  Basic API Result:', basicResult);
    
    if (basicResult.valid) {
      const paidResult = await testGeminiPaidKey(TEST_CONFIG.PAID_KEY, TEST_CONFIG.MODEL, TEST_CONFIG.PROXY_URL);
      console.log('  Paid Detection Result:', paidResult);
      
      results.push({
        keyType: 'PAID',
        basicValid: basicResult.valid,
        isPaid: paidResult.isPaid,
        expectedDisplay: paidResult.isPaid ? '💎 付费' : '🆓 免费',
        status: paidResult.isPaid ? 'PASS ✅' : 'FAIL ❌'
      });
    }
  } catch (error) {
    console.error('  Error testing paid key:', error);
    results.push({ keyType: 'PAID', status: 'ERROR ❌', error: error.message });
  }
  
  // Test 2: Free Key  
  console.log('\n📋 Test 2: Testing Free Key...');
  try {
    const basicResult = await testGeminiKey(TEST_CONFIG.FREE_KEY, TEST_CONFIG.MODEL, TEST_CONFIG.PROXY_URL);
    console.log('  Basic API Result:', basicResult);
    
    if (basicResult.valid) {
      const paidResult = await testGeminiPaidKey(TEST_CONFIG.FREE_KEY, TEST_CONFIG.MODEL, TEST_CONFIG.PROXY_URL);
      console.log('  Paid Detection Result:', paidResult);
      
      results.push({
        keyType: 'FREE',
        basicValid: basicResult.valid,
        isPaid: paidResult.isPaid,
        expectedDisplay: paidResult.isPaid === false ? '🆓 免费' : '💎 付费',
        status: paidResult.isPaid === false ? 'PASS ✅' : 'FAIL ❌'
      });
    }
  } catch (error) {
    console.error('  Error testing free key:', error);
    results.push({ keyType: 'FREE', status: 'ERROR ❌', error: error.message });
  }
  
  // Test 3: Invalid Key
  console.log('\n📋 Test 3: Testing Invalid Key...');
  try {
    const basicResult = await testGeminiKey(TEST_CONFIG.INVALID_KEY, TEST_CONFIG.MODEL, TEST_CONFIG.PROXY_URL);
    console.log('  Basic API Result:', basicResult);
    
    results.push({
      keyType: 'INVALID',
      basicValid: basicResult.valid,
      isPaid: null,
      expectedDisplay: '无效',
      status: !basicResult.valid ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (error) {
    console.error('  Error testing invalid key:', error);
    results.push({ keyType: 'INVALID', status: 'ERROR ❌', error: error.message });
  }
  
  // Display Results
  console.log('\n📊 Test Results Summary:');
  console.table(results);
  
  // Check overall status
  const allPassed = results.every(r => r.status.includes('PASS'));
  console.log(`\n🎯 Overall Test Status: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  
  return results;
};

/**
 * Quick UI Test Function
 * Tests the display logic directly
 */
window.testPaidKeyDisplay = function() {
  console.log('🖥️ Testing Display Logic...\n');
  
  // Mock key data scenarios
  const testScenarios = [
    { key: 'paid-key', status: 'paid', isPaid: true, expected: '💎 付费' },
    { key: 'free-key', status: 'valid', isPaid: false, expected: '🆓 免费' },
    { key: 'invalid-key', status: 'invalid', isPaid: null, expected: 'No display' },
    { key: 'rate-limited-key', status: 'rate-limited', isPaid: null, expected: 'No display' }
  ];
  
  testScenarios.forEach(scenario => {
    const shouldDisplay = (scenario.status === 'valid' || scenario.status === 'paid') && scenario.isPaid !== null;
    const displayText = shouldDisplay 
      ? (scenario.isPaid ? '💎 付费' : '🆓 免费')
      : 'No display';
    
    const testResult = displayText === scenario.expected ? 'PASS ✅' : 'FAIL ❌';
    
    console.log(`${testResult} ${scenario.key}: ${displayText}`);
  });
};

// Export for use in other tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runPaidKeyDetectionTest: window.runPaidKeyDetectionTest,
    testPaidKeyDisplay: window.testPaidKeyDisplay,
    TEST_CONFIG
  };
}

console.log(`
🧪 Paid Key Detection Test Script Loaded!

To run tests:
1. Update TEST_CONFIG with your API keys
2. Run: await runPaidKeyDetectionTest()
3. Or run: testPaidKeyDisplay() for UI logic test

Expected Results:
- Paid keys → 💎 付费
- Free keys → 🆓 免费  
- Invalid keys → 无效 status
`);
