import { ensureMongoConnection } from '../utils/ensure-mongo-connection.js'

export default defineEventHandler(async (event) => {
  try {
    await ensureMongoConnection()
  } catch (error) {
    console.error('MongoDB health check failed:', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'MongoDB is not connected'
    })
  }

  return { status: 'ok', message: 'Server is healthy' }
})