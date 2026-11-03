import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, queueJob } from '../src/scheduler'

describe('scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('nextTick', () => {
    it('should execute callback in next microtask', async () => {
      const fn = vi.fn()
      nextTick(fn)

      expect(fn).not.toHaveBeenCalled()
      await vi.runAllTimers()
      expect(fn).toHaveBeenCalled()
    })

    it('should return promise that resolves in next microtask', async () => {
      let resolved = false

      const promise = nextTick(() => {
        resolved = true
      })

      expect(resolved).toBe(false)
      await promise
      expect(resolved).toBe(true)
    })
  })

  describe('queueJob', () => {
    it('should queue job and execute it', async () => {
      const job = vi.fn()
      queueJob(job)

      expect(job).not.toHaveBeenCalled()
      await vi.runAllTimers()
      expect(job).toHaveBeenCalled()
    })

    it('should not queue duplicate jobs', async () => {
      const job = vi.fn()
      queueJob(job)
      queueJob(job)

      await vi.runAllTimers()

      expect(job).toHaveBeenCalledTimes(1)
    })

    it('should execute jobs in order', async () => {
      const order: number[] = []
      const job1 = vi.fn(() => order.push(1))
      const job2 = vi.fn(() => order.push(2))
      const job3 = vi.fn(() => order.push(3))

      queueJob(job1)
      queueJob(job2)
      queueJob(job3)

      await vi.runAllTimers()
      expect(order).toEqual([1, 2, 3])
    })

    it('should handle jobs that queue more jobs', async () => {
      const job1 = vi.fn()
      const job2 = vi.fn(() => queueJob(job1))

      queueJob(job2)
      await vi.runAllTimers()

      expect(job2).toHaveBeenCalled()
      expect(job1).toHaveBeenCalled()
    })

    it('should wait for queue to empty when calling nextTick without callback', async () => {
      const job = vi.fn()
      queueJob(job)

      // Call nextTick without callback while queue has jobs
      const promise = nextTick()

      // Flush microtasks to run checkQueue
      await Promise.resolve()

      // Now run timers to execute flushJobs and checkQueue
      vi.runAllTimers()

      // flushJobs executes job
      expect(job).toHaveBeenCalled()

      // Now the promise should resolve
      await promise
    })

    it('should resolve nextTick promise after queued jobs', async () => {
      const job = vi.fn()
      queueJob(job)

      // Call nextTick without callback
      const promise = nextTick()

      // The promise should resolve after the queued job runs
      await promise

      expect(job).toHaveBeenCalled()
    })

    it('should handle rapid queueJob calls efficiently', async () => {
      const microtaskSpy = vi.spyOn(globalThis, 'queueMicrotask')
      const job1 = vi.fn()
      const job2 = vi.fn()
      const job3 = vi.fn()

      queueJob(job1)
      queueJob(job2)
      queueJob(job3)

      expect(microtaskSpy).toHaveBeenCalledTimes(1)

      await vi.runAllTimers()

      expect(job1).toHaveBeenCalled()
      expect(job2).toHaveBeenCalled()
      expect(job3).toHaveBeenCalled()

      microtaskSpy.mockRestore()
    })

    it('should execute callback in next microtask via nextTick', async () => {
      const callback = vi.fn();
      nextTick(callback);

      expect(callback).not.toHaveBeenCalled();

      // Wait for microtask to execute
      await Promise.resolve();
      await vi.runAllTimers();

      expect(callback).toHaveBeenCalled();
    });

    it('should handle undefined callback in nextTick', async () => {
      // Should not throw when no callback provided
      expect(() => nextTick()).not.toThrow();

      // Wait for microtask
      await Promise.resolve();
    });

    it('should execute multiple independent nextTick callbacks', async () => {
      const order: number[] = [];

      nextTick(() => order.push(1));
      nextTick(() => order.push(2));
      nextTick(() => order.push(3));

      await vi.runAllTimers();
      expect(order).toEqual([1, 2, 3]);
    });

  })
})