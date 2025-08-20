const featureFlags = {
	// 付费检测默认开启
	paidDetection: true,
	paidDetectionMaxConcurrency: 5,
	paidDetectionBackoff: {
		baseMs: 500,
		factor: 2,
		maxMs: 8000,
		retries: 2
	},
	paidDetectionMinTextLen: 8000,  // ~2048 tokens for gemini-2.5-flash-lite, ~1024 tokens for gemini-2.5-flash
	// 调试与看门狗
	debugQueue: false,
	queueWatchdogMs: 10000
};

try {
	if (typeof window !== 'undefined') {
		window.featureFlags = featureFlags;
	}
} catch (_) {}




