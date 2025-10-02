/**
 * Tests built with Jest (with @testing-library/jest-dom available via setupTests.js).
 * Focus: ensuring recent performance utilities and instrumentation behave as expected.
 */

import { performance, PerformanceObserver } from 'perf_hooks';

describe('Performance instrumentation suite', () => {
  describe('execution timing helpers', () => {
    const estimateExecutionTime = (fn, iterations = 1) => {
      const start = performance.now();
      for (let i = 0; i < iterations; i += 1) {
        fn(i);
      }
      const end = performance.now();
      return end - start;
    };

    test('estimateExecutionTime provides non-negative duration', () => {
      const duration = estimateExecutionTime((i) => i * i, 50);
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(duration)).toBe(true);
    });

    test('estimateExecutionTime reflects additional workload', () => {
      const fast = estimateExecutionTime(() => {});
      const slow = estimateExecutionTime(() => {
        let acc = 0;
        for (let i = 0; i < 10_000; i += 1) {
          acc += i;
        }
        return acc;
      }, 5);
      expect(slow).toBeGreaterThan(fast);
    });
  });

  describe('performance marks and measures', () => {
    test('performance marks generate measurable entries', () => {
      const MEASURE_NAME = `measure-${Date.now()}`;
      performance.mark(`${MEASURE_NAME}-start`);
      const array = new Array(5_000).fill(0).map((_, idx) => idx);
      array.reverse();
      performance.mark(`${MEASURE_NAME}-end`);
      performance.measure(MEASURE_NAME, `${MEASURE_NAME}-start`, `${MEASURE_NAME}-end`);

      const [entry] = performance.getEntriesByName(MEASURE_NAME);
      expect(entry).toBeDefined();
      expect(entry.duration).toBeGreaterThanOrEqual(0);

      performance.clearMarks(`${MEASURE_NAME}-start`);
      performance.clearMarks(`${MEASURE_NAME}-end`);
      performance.clearMeasures(MEASURE_NAME);
    });

    test('PerformanceObserver captures measure events', (done) => {
      const obs = new PerformanceObserver((items) => {
        const measure = items.getEntries().find((entry) => entry.name.startsWith('observed'));
        if (measure) {
          expect(measure.duration).toBeGreaterThanOrEqual(0);
          obs.disconnect();
          done();
        }
      });
      obs.observe({ entryTypes: ['measure'] });

      performance.mark('observed-start');
      const buffer = Buffer.alloc(32_768);
      buffer.fill('a');
      performance.mark('observed-end');
      performance.measure(`observed-${Date.now()}`, 'observed-start', 'observed-end');
    });
  });

  describe('process metrics', () => {
    test('process.memoryUsage returns expected keys with numeric values', () => {
      const stats = process.memoryUsage();
      expect(stats).toHaveProperty('rss');
      expect(stats).toHaveProperty('heapTotal');
      expect(stats).toHaveProperty('heapUsed');
      
      // Strictly positive for the core metrics
      expect(typeof stats.rss).toBe('number');
      expect(stats.rss).toBeGreaterThan(0);
      expect(typeof stats.heapTotal).toBe('number');
      expect(stats.heapTotal).toBeGreaterThan(0);
      expect(typeof stats.heapUsed).toBe('number');
      expect(stats.heapUsed).toBeGreaterThan(0);
      
      // All fields must still be numbers ≥ 0 to catch anomalies
      Object.entries(stats).forEach(([, value]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    test('hrtime.bigint provides monotonic increasing values', () => {
      const first = process.hrtime.bigint();
      const second = process.hrtime.bigint();
      expect(second).toBeGreaterThanOrEqual(first);
    });
  });

  describe('concurrency comparisons', () => {
    const task = (delay) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(delay), delay);
      });

    test('parallel execution is faster than sequential', async () => {
      const delays = [20, 25, 30];

      const sequentialStart = performance.now();
      // eslint-disable-next-line no-restricted-syntax
      for (const ms of delays) {
        // eslint-disable-next-line no-await-in-loop
        await task(ms);
      }
      const sequentialDuration = performance.now() - sequentialStart;

      const parallelStart = performance.now();
      await Promise.all(delays.map(task));
      const parallelDuration = performance.now() - parallelStart;

      expect(parallelDuration).toBeLessThan(sequentialDuration);
    });
  });

  describe('regression guardrails', () => {
    const expensiveOperation = () => {
      const numbers = Array.from({ length: 2_000 }, (_, idx) => idx + 1);
      return numbers.reduce((acc, value) => acc + Math.sqrt(value), 0);
    };

    test('expensiveOperation stays within acceptable time budget', () => {
      const start = performance.now();
      const result = expensiveOperation();
      const duration = performance.now() - start;

      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(duration)).toBe(true);
      expect(duration).toBeLessThan(250);
    });

    test('repeated expensiveOperation does not leak memory significantly', () => {
      const before = process.memoryUsage().heapUsed;
      for (let i = 0; i < 10; i += 1) {
        expensiveOperation();
      }
      global.gc?.();
      const after = process.memoryUsage().heapUsed;

      // Allow slight fluctuation but guard against runaway growth
      const delta = after - before;
      expect(delta).toBeLessThan(5 * 1024 * 1024); // < 5 MB
    });
  });
});