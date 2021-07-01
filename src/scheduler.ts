let flushPending = false
let flushing = false
const queue: Function[] = []
const p = Promise.resolve()

export function queueJob(job: Function) {
  if (!queue.includes(job)) queue.push(job)
  if (!flushing && !flushPending) {
    flushPending = true
    p.then(flushJobs)
  }
}

export function flushJobs() {
  flushPending = false
  flushing = true
  for (let i = 0; i < queue.length; i++) {
    queue[i]()
  }
  queue.length = 0
  flushing = false
}
