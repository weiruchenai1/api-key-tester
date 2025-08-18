function toggleTheme() {
	isDarkTheme = !isDarkTheme;
	const themeBtn = document.getElementById('themeBtn');
	if (isDarkTheme) {
		document.body.classList.add('dark-theme');
		themeBtn.textContent = '☀️';
		themeBtn.title = currentLang === 'zh' ? '切换到浅色模式' : 'Switch to Light Mode';
	} else {
		document.body.classList.remove('dark-theme');
		themeBtn.textContent = '🌙';
		themeBtn.title = currentLang === 'zh' ? '切换到深色模式' : 'Switch to Dark Mode';
	}
}

try {
	if (typeof window !== 'undefined') {
		window.toggleTheme = toggleTheme;
	}
} catch (_) {}


