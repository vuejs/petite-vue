let queued = false
const queue: Function[] = []
const p = Promise.resolve()

export const queueJob = (job: Function) => {
  if (!queue.includes(job)) queue.push(job)
  if (!queued) {
    queued = true
    p.then(flushJobs)
  }
}

const flushJobs = () => {
  for (let i = 0; i < queue.length; i++) {
    queue[i]()
  }
  queue.length = 0
  queued = false
}
