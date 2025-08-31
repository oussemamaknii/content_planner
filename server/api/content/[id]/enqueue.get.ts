import { publishQueue } from '../../../plugins/queue'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const jobId = `publishContent:${id}`
  const job = await publishQueue.getJob(jobId)
  if (!job) return { enqueued: false }
  const state = await job.getState()
  const activeStates = ['waiting', 'delayed', 'active', 'paused', 'waiting-children']
  return { enqueued: activeStates.includes(state), state }
})


