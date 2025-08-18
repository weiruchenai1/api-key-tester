export default {
	test: {
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['js/**/*.js'],
			exclude: [],
			thresholds: {
				lines: 90,
				functions: 90,
				statements: 90,
				branches: 80
			}
		}
	}
};


