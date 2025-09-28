/**
 * 文件处理工具测试
 */

import {
  extractApiKeys,
  validateFileType,
  readFileAsText,
  exportResultsAsJson,
  downloadFile
} from '../../utils/fileHandler';

// Mock FileReader
class MockFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file, encoding) {
    setTimeout(() => {
      if (this.error) {
        this.onerror && this.onerror();
      } else {
        this.onload && this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

global.FileReader = MockFileReader;

describe('FileHandler Utilities', () => {
  describe('extractApiKeys', () => {
    test('should extract OpenAI API keys', () => {
      const content = 'Here is my key: sk-abcdefghijklmnopqrstuvwxyz123456789 and some text';
      const keys = extractApiKeys(content);
      
      expect(keys).toContain('sk-abcdefghijklmnopqrstuvwxyz123456789');
      expect(keys.length).toBe(1);
    });

    test('should extract Gemini API keys', () => {
      const content = 'Gemini key: AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012';
      const keys = extractApiKeys(content);
      
      expect(keys).toContain('AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012');
      expect(keys.length).toBe(1);
    });

    test('should extract multiple different API keys', () => {
      const content = `
        sk-abcdefghijklmnopqrstuvwxyz123456789
        AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012
        gsk_AbCdEfGhIjKlMnOpQrStUvWxYz123456
      `;
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(3);
      expect(keys).toContain('sk-abcdefghijklmnopqrstuvwxyz123456789');
      expect(keys).toContain('AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012');
      expect(keys).toContain('gsk_AbCdEfGhIjKlMnOpQrStUvWxYz123456');
    });

    test('should remove duplicates', () => {
      const content = `
        sk-abcdefghijklmnopqrstuvwxyz123456789
        sk-abcdefghijklmnopqrstuvwxyz123456789
        sk-differentkey123456789012345678901
      `;
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(2);
      expect(keys).toContain('sk-abcdefghijklmnopqrstuvwxyz123456789');
      expect(keys).toContain('sk-differentkey123456789012345678901');
    });

    test('should sort keys by length (longer first)', () => {
      const content = `
        sk-short123456789012345
        sk-verylongkeywithlotsofrandomcharacters123456789
        sk-medium123456789012345678901
      `;
      const keys = extractApiKeys(content);
      
      expect(keys[0]).toBe('sk-verylongkeywithlotsofrandomcharacters123456789');
      expect(keys[1]).toBe('sk-medium123456789012345678901');
      expect(keys[2]).toBe('sk-short123456789012345');
    });

    test('should extract generic pattern keys when no specific patterns found', () => {
      const content = 'api_key123456789012345678901234567890';
      const keys = extractApiKeys(content);
      
      expect(keys).toContain('api_key123456789012345678901234567890');
    });

    test('should extract long strings as fallback', () => {
      const content = 'SomeRandomAPIToken123ABC456DEF789GHI012JKL345MNO';
      const keys = extractApiKeys(content);
      
      expect(keys).toContain('SomeRandomAPIToken123ABC456DEF789GHI012JKL345MNO');
    });

    test('should filter out numeric-only strings', () => {
      const content = '123456789012345678901234567890';
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(0);
    });

    test('should filter out letter-only strings', () => {
      const content = 'abcdefghijklmnopqrstuvwxyzabcdefghij';
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(0);
    });

    test('should clean special characters from keys', () => {
      const content = 'sk-abc"def123,456!789@012#345$678%901^234&567*890(123)456';
      const keys = extractApiKeys(content);
      
      expect(keys[0]).toBe('sk-abcdef123456789012345678901234567890123456');
    });

    test('should reject keys shorter than 15 characters', () => {
      const content = 'sk-short123 sk-toolongtobevalid123456789012345';
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(1);
      expect(keys[0]).toBe('sk-toolongtobevalid123456789012345');
    });

    test('should require both letters and numbers in cleaned keys', () => {
      const content = 'sk-abcdefghijklmnopqrstuvwxyz sk-123456789012345678901234';
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(0);
    });

    test('should handle empty or invalid input', () => {
      expect(extractApiKeys('')).toEqual([]);
      expect(extractApiKeys(null)).toEqual([]);
      expect(extractApiKeys(undefined)).toEqual([]);
      expect(extractApiKeys(123)).toEqual([]);
      expect(extractApiKeys({})).toEqual([]);
    });

    test('should handle Chinese characters and clean them', () => {
      const content = 'sk-abc123中文def456测试ghi789';
      const keys = extractApiKeys(content);
      
      if (keys.length > 0) {
        expect(keys[0]).toMatch(/^sk-[a-zA-Z0-9_-]+$/);
        expect(keys[0]).not.toMatch(/[\u4e00-\u9fff]/);
      }
    });
  });

  describe('validateFileType', () => {
    test('should validate .txt files', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });

    test('should validate text/plain MIME type', () => {
      const file = new File(['content'], 'test', { type: 'text/plain' });
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });

    test('should validate files with empty MIME type but .txt extension', () => {
      const file = new File(['content'], 'test.txt', { type: '' });
      const result = validateFileType(file);
      
      expect(result.valid).toBe(true);
    });

    test('should reject non-text files', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFileType(file);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_type');
    });

    test('should reject files larger than 10MB', () => {
      const file = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      const result = validateFileType(file);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('too_large');
    });

    test('should reject null/undefined files', () => {
      expect(validateFileType(null).valid).toBe(false);
      expect(validateFileType(null).reason).toBe('no_file');
      
      expect(validateFileType(undefined).valid).toBe(false);
      expect(validateFileType(undefined).reason).toBe('no_file');
    });

    test('should accept files up to 10MB', () => {
      const file = new File(['x'.repeat(100)], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
      
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('readFileAsText', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should read valid file successfully', async () => {
      const content = 'sk-test123456789012345678901234567890';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      
      MockFileReader.prototype.result = content;
      MockFileReader.prototype.error = null;
      
      const promise = readFileAsText(file);
      jest.advanceTimersByTime(10);
      
      const result = await promise;
      expect(result).toBe(content);
    });

    test('should reject invalid file types', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(readFileAsText(file)).rejects.toThrow('文件验证失败: invalid_type');
    });

    test('should reject files too large', async () => {
      const file = new File(['content'], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      await expect(readFileAsText(file)).rejects.toThrow('文件验证失败: too_large');
    });

    test('should reject null files', async () => {
      await expect(readFileAsText(null)).rejects.toThrow('文件验证失败: no_file');
    });

    test('should handle FileReader errors', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      MockFileReader.prototype.error = new Error('Read failed');
      MockFileReader.prototype.result = null;
      
      const promise = readFileAsText(file);
      jest.advanceTimersByTime(10);
      
      await expect(promise).rejects.toThrow('文件读取失败');
    });
  });

  describe('exportResultsAsJson', () => {
    test('should create JSON blob with results and summary', () => {
      const keyResults = [
        { key: 'sk-test123', status: 'valid', service: 'openai' },
        { key: 'sk-test456', status: 'invalid', service: 'openai' }
      ];
      const summary = { total: 2, valid: 1, invalid: 1 };
      
      const blob = exportResultsAsJson(keyResults, summary);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    test('should include timestamp in exported data', () => {
      const keyResults = [];
      const summary = { total: 0 };
      
      const blob = exportResultsAsJson(keyResults, summary);
      
      // Read blob content to verify timestamp
      return blob.text().then(content => {
        const data = JSON.parse(content);
        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(data.summary).toEqual(summary);
        expect(data.results).toEqual(keyResults);
      });
    });

    test('should format JSON with proper indentation', () => {
      const keyResults = [{ key: 'test', status: 'valid' }];
      const summary = { total: 1 };
      
      const blob = exportResultsAsJson(keyResults, summary);
      
      return blob.text().then(content => {
        expect(content).toContain('  '); // Should have 2-space indentation
        expect(content).toContain('\n'); // Should have newlines
      });
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock DOM methods
      global.document = {
        createElement: jest.fn(() => ({
          href: '',
          download: '',
          click: jest.fn()
        })),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }
      };
    });

    test('should create download link and trigger download', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      
      downloadFile(blob, filename);
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(global.document.body.appendChild).toHaveBeenCalled();
      expect(global.document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    test('should set correct href and download attributes', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      global.document.createElement.mockReturnValue(mockLink);
      
      const blob = new Blob(['test'], { type: 'text/plain' });
      downloadFile(blob, 'results.json');
      
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe('results.json');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete file processing workflow', async () => {
      jest.useFakeTimers();
      
      // Step 1: Create file with API keys
      const content = `
        Here are some API keys:
        sk-abcdefghijklmnopqrstuvwxyz123456789
        AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012
        invalid-key
      `;
      const file = new File([content], 'keys.txt', { type: 'text/plain' });
      
      // Step 2: Validate file
      const validation = validateFileType(file);
      expect(validation.valid).toBe(true);
      
      // Step 3: Read file
      MockFileReader.prototype.result = content;
      MockFileReader.prototype.error = null;
      
      const promise = readFileAsText(file);
      jest.advanceTimersByTime(10);
      const fileContent = await promise;
      
      // Step 4: Extract API keys
      const extractedKeys = extractApiKeys(fileContent);
      expect(extractedKeys.length).toBe(2);
      expect(extractedKeys).toContain('sk-abcdefghijklmnopqrstuvwxyz123456789');
      expect(extractedKeys).toContain('AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012');
      
      // Step 5: Create results and export
      const keyResults = extractedKeys.map(key => ({
        key,
        status: 'tested',
        service: key.startsWith('sk-') ? 'openai' : 'gemini'
      }));
      
      const summary = {
        total: keyResults.length,
        tested: keyResults.length
      };
      
      const blob = exportResultsAsJson(keyResults, summary);
      expect(blob).toBeInstanceOf(Blob);
      
      jest.useRealTimers();
    });

    test('should handle files with no valid API keys', () => {
      const content = 'This file has no API keys, just regular text and some numbers 123456789';
      const keys = extractApiKeys(content);
      
      expect(keys.length).toBe(0);
    });

    test('should handle mixed content with special characters', () => {
      const content = `
        # API Keys Configuration
        OPENAI_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789
        GEMINI_KEY="AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012"
        # End of config
      `;
      
      const keys = extractApiKeys(content);
      expect(keys.length).toBe(2);
      expect(keys).toContain('sk-abcdefghijklmnopqrstuvwxyz123456789');
      expect(keys).toContain('AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789012');
    });
  });
});