let queued = false
const queue: Function[] = []
const p = Promise.resolve()

export const nextTick = (fn: () => void) => p.then(fn)

export const queueJob = (job: Function) => {
  if (!queue.includes(job)) queue.push(job)
  if (!queued) {
    queued = true
    nextTick(flushJobs)
  }
}

const flushJobs = () => {
  for (const job of queue) {
    job()
  }
  queue.length = 0
  queued = false
}
