let queued = false
const queue: Function[] = []

export const queueJob = (job: Function) => {
  if (!queue.includes(job)) queue.push(job)
  if (!queued) {
    queued = true
    queueMicrotask(flushJobs)
  }
}

/**
 * Defers the execution of the provided function to the next DOM update cycle.
 * @param fn - The function to execute.
 */
export const nextTick = (fn?: () => void): void => {
  queueMicrotask(() => fn?.())
}

const flushJobs = () => {
  for (const job of queue) {
    job()
  }
  queue.length = 0
  queued = false
}
