(function(){
	const container = document.createElement('div');
	container.style.fontFamily = 'sans-serif';
	container.style.padding = '12px';
	document.addEventListener('DOMContentLoaded', () => {
		document.body.appendChild(container);
	});

	let passed = 0;
	let failed = 0;

	function log(message, color) {
		const p = document.createElement('div');
		p.textContent = message;
		if (color) p.style.color = color;
		container.appendChild(p);
	}

	function isPromise(val) {
		return val && typeof val.then === 'function';
	}

	window.test = function(name, fn) {
		try {
			const result = fn();
			if (isPromise(result)) {
				return result.then(() => {
					passed++;
					log('✔ ' + name, 'green');
				}).catch(err => {
					failed++;
					log('✖ ' + name + ' - ' + (err && err.message || err), 'red');
				});
			}
			passed++;
			log('✔ ' + name, 'green');
		} catch (err) {
			failed++;
			log('✖ ' + name + ' - ' + (err && err.message || err), 'red');
		}
	};

	window.expectEqual = function(actual, expected, hint) {
		if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			throw new Error((hint ? hint + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
		}
	};

	window.finish = function() {
		const summary = document.createElement('div');
		summary.style.marginTop = '12px';
		summary.style.fontWeight = 'bold';
		summary.textContent = 'Passed: ' + passed + ', Failed: ' + failed;
		container.appendChild(summary);
	};
})();


