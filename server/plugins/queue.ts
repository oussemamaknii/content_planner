import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { publishSchedule } from '../utils/publish'

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  // BullMQ requirement
  maxRetriesPerRequest: null,
  enableReadyCheck: false
})
export const publishQueue = new Queue('publish', { connection })

// Worker to process publish jobs
const worker = new Worker(
  'publish',
  async (job) => {
    if (job.name === 'publishSchedule') {
      const scheduleId = job.data.scheduleId as string
      await publishSchedule(scheduleId)
    } else if (job.name === 'publishContent') {
      const { publishContentDefault } = await import('../utils/publish')
      const contentId = job.data.contentId as string
      await publishContentDefault(contentId)
    }
  },
  { connection, concurrency: 2 }
)

// On crash, log
worker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error('publish job failed', job?.id, err?.message)
})

export default defineNitroPlugin(() => {
  // Plugin exists to ensure this module is loaded (initializes worker/queue)
})


