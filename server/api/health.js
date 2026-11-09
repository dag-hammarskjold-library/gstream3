import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  if (mongoose.connection.readyState !== 1) {
    throw createError({
      statusCode: 503,
      statusMessage: 'MongoDB is not connected'
    })
  }

  return { status: 'ok', message: 'Server is healthy' }
})