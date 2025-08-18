export default {
	test: {
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['js/**/*.js'],
			exclude: []
		}
	}
};


