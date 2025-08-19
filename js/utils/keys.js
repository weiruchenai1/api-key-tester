const MAX_KEY_LENGTH = 128;

function deduplicateAndCleanKeys(keys) {
	const seen = new Set();
	const uniqueKeys = [];
	const duplicates = [];
	keys.forEach(key => {
		const cleanKey = key.trim();
		if (cleanKey && !seen.has(cleanKey)) {
			seen.add(cleanKey);
			uniqueKeys.push(cleanKey);
		} else if (cleanKey && seen.has(cleanKey)) {
			duplicates.push(cleanKey);
		}
	});
	return { uniqueKeys, duplicates };
}

function extractKeysFromContent(content) {
	const keys = [];
	const openaiPattern = /sk-[A-Za-z0-9_-]{30,128}/g;
	const geminiPattern = /AIzaSy[A-Za-z0-9_-]{30,128}/g;
	const coherePattern = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{40,128}(?![A-Za-z0-9_-])/g;
	const anthropicPattern = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{32,128}(?![A-Za-z0-9_-])/g;
	const genericPattern = /(?:sk-|gsk_|api_|key_|token_|pk-)[A-Za-z0-9_-]{20,128}/g;

	let matches = content.match(openaiPattern);
	if (matches) keys.push(...matches);
	matches = content.match(geminiPattern);
	if (matches) keys.push(...matches);
	// 引入 cohere / anthropic 进入同层匹配
	matches = content.match(coherePattern);
	if (matches) keys.push(...matches);
	matches = content.match(anthropicPattern);
	if (matches) keys.push(...matches);
	if (keys.length === 0) {
		matches = content.match(genericPattern);
		if (matches) keys.push(...matches);
	}
	if (keys.length === 0) {
		// 边界受限的兜底：两侧均非 [A-Za-z0-9_-]，避免命中更长标识符的子串
		const longStringPattern = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{25,128}(?![A-Za-z0-9_-])/g;
		matches = content.match(longStringPattern);
		if (matches) {
			const filteredMatches = matches.filter(match => {
				// 必须同时包含至少 3 个字母与 3 个数字，进一步抑制账号/标识类串
				const letterCount = (match.match(/[A-Za-z]/g) || []).length;
				const digitCount = (match.match(/\d/g) || []).length;
				return letterCount >= 3 && digitCount >= 3;
			});
			keys.push(...filteredMatches);
		}
	}
	// 先根据总长度裁剪（包含前缀），再去重并保序，避免超长分片被保留
	const trimmed = keys.filter(k => k.length <= MAX_KEY_LENGTH);
	return [...new Set(trimmed)];
}

function cleanApiKey(key) {
	let cleaned = key.replace(/[^\w\-]/g, '');
	if (cleaned.length < 15) return null;
	if (cleaned.length > MAX_KEY_LENGTH) return null;
	const hasLetters = /[a-zA-Z]/.test(cleaned);
	const hasNumbers = /[0-9]/.test(cleaned);
	if (!hasLetters || !hasNumbers) return null;
	return cleaned;
}

function extractApiKeys(content) {
	const keys = [];
	const extractedKeys = extractKeysFromContent(content);
	for (let key of extractedKeys) {
		const cleanedKey = cleanApiKey(key);
		if (cleanedKey && cleanedKey.length >= 15) {
			keys.push(cleanedKey);
		}
	}
	const uniqueKeys = [...new Set(keys)];
	return uniqueKeys.sort((a, b) => b.length - a.length);
}

try {
	if (typeof window !== 'undefined') {
		window.deduplicateAndCleanKeys = deduplicateAndCleanKeys;
		window.extractApiKeys = extractApiKeys;
		window.extractKeysFromContent = extractKeysFromContent;
		window.cleanApiKey = cleanApiKey;
	}
} catch (_) {}


