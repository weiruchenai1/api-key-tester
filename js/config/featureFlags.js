const featureFlags = {
	paidDetection: false,
	paidDetectionMaxConcurrency: 5,
	paidDetectionBackoff: {
		baseMs: 500,
		factor: 2,
		maxMs: 8000,
		retries: 2
	},
	paidDetectionMinTextLen: 8000,
	// 调试与看门狗
	debugQueue: false,
	queueWatchdogMs: 10000
};

try {
	if (typeof window !== 'undefined') {
		window.featureFlags = featureFlags;
	}
} catch (_) {}




