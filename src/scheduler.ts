let queued = false
const queue: Function[] = []
const p = Promise.resolve()

export function queueJob(job: Function) {
  if (!queue.includes(job)) queue.push(job)
  if (!queued) {
    queued = true
    p.then(flushJobs)
  }
}

export function flushJobs() {
  for (let i = 0; i < queue.length; i++) {
    queue[i]()
  }
  queue.length = 0
  queued = false
}
