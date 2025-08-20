import { describe, it, expect, beforeEach } from 'vitest';

describe('utils/keys', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('deduplicateAndCleanKeys 去重并保留顺序', async () => {
		await import('../../js/utils/keys.js');
		const { deduplicateAndCleanKeys } = window;
		const input = [' keyA ', 'keyB', 'keyA', '', 'keyC', 'keyB'];
		const { uniqueKeys, duplicates } = deduplicateAndCleanKeys(input);
		expect(uniqueKeys).toEqual(['keyA', 'keyB', 'keyC']);
		expect(duplicates).toEqual(['keyA', 'keyB']);
	});

	it('cleanApiKey 清理干扰字符并校验', async () => {
		await import('../../js/utils/keys.js');
		const { cleanApiKey } = window;
		const longValid = 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234';
		expect(cleanApiKey(longValid)).toBe(longValid);
		expect(cleanApiKey('short12')).toBeNull();
		expect(cleanApiKey('onlyletters________________')).toBeNull();
		expect(cleanApiKey('12345678901234567890')).toBeNull();
		expect(cleanApiKey('sk-中文ABC123@@@____----')).toBe('sk-ABC123____----');
	});

	it('extractKeysFromContent 匹配 openai 与 gemini；含特定匹配时不再追加通用；以及兜底', async () => {
		await import('../../js/utils/keys.js');
		const { extractKeysFromContent } = window;
		const openaiKey = 'sk-' + 'a'.repeat(28) + '12'; // 含数字
		const geminiKey = 'AIzaSy' + 'A'.repeat(29) + '9'; // 含数字
		const genericKey = 'token_' + 'b'.repeat(20);
		const content = `prefix ${openaiKey} mid ${geminiKey} end ${genericKey}`;
		const keys = extractKeysFromContent(content);
		expect(keys).toEqual([openaiKey, geminiKey]);

		// 兜底：仅长串且混合字母数字（非纯字母/数字）
		const fallbackMixed = 'abc123xyzuvwabc123xyz'; // 21，不足25，补长
		const fallback = fallbackMixed + '___000aaa'; // >=25 且混合
		const onlyFallback = extractKeysFromContent(`text ${fallback} tail`);
		expect(onlyFallback).toEqual([fallback]);
	});

	it('extractApiKeys 端到端：清洗+去重+按长度降序', async () => {
		await import('../../js/utils/keys.js');
		const { extractApiKeys } = window;
		const k1 = 'sk-' + 'a'.repeat(28) + '12';
		const k2 = 'AIzaSy' + 'B'.repeat(34) + '9';
		const noisy = `${k1}@@@\n${k2}\n${k1}`;
		const out = extractApiKeys(noisy);
		expect(out[0].length).toBeGreaterThanOrEqual(out[1].length);
		expect(new Set(out)).toEqual(new Set([k1, k2]));
	});
});


