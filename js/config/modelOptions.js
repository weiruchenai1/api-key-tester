const modelOptions = {
	openai: [
		'gpt-4o',
		'gpt-4o-mini',
		'gpt-4-turbo',
		'gpt-4',
		'gpt-3.5-turbo'
	],
	claude: [
		'claude-3-5-sonnet-20241022',
		'claude-3-5-haiku-20241022',
		'claude-3-opus-20240229',
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307'
	],
	gemini: [
		'gemini-2.0-flash',
		'gemini-2.5-flash',
		'gemini-2.5-pro'
	]
};

try {
	if (typeof window !== 'undefined') {
		window.modelOptions = modelOptions;
	}
} catch (_) {}



