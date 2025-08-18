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
	const openaiPattern = /sk-[a-zA-Z0-9\u4e00-\u9fff\-_]{30,}/g;
	const geminiPattern = /AIzaSy[a-zA-Z0-9\u4e00-\u9fff_\-]{30,}/g;
	const coherePattern = /[a-zA-Z0-9\u4e00-\u9fff\-_]{40,}/g;
	const anthropicPattern = /[a-zA-Z0-9\u4e00-\u9fff\-_]{32,}/g;
	const genericPattern = /(?:sk-|gsk_|api_|key_|token_|pk-)[a-zA-Z0-9\u4e00-\u9fff\-_]{20,}/g;

	let matches = content.match(openaiPattern);
	if (matches) keys.push(...matches);
	matches = content.match(geminiPattern);
	if (matches) keys.push(...matches);
	if (keys.length === 0) {
		matches = content.match(genericPattern);
		if (matches) keys.push(...matches);
	}
	if (keys.length === 0) {
		const longStringPattern = /[a-zA-Z0-9\u4e00-\u9fff\-_]{25,}/g;
		matches = content.match(longStringPattern);
		if (matches) {
			const filteredMatches = matches.filter(match => {
				return !/^[0-9]+$/.test(match.replace(/[\u4e00-\u9fff]/g, '')) && !/^[a-zA-Z]+$/.test(match.replace(/[\u4e00-\u9fff]/g, ''));
			});
			keys.push(...filteredMatches);
		}
	}
	return keys;
}

function cleanApiKey(key) {
	let cleaned = key.replace(/[^\w\-]/g, '');
	if (cleaned.length < 15) return null;
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


