import mongoose from 'mongoose'

let connectionPromise

const waitForConnection = () => new Promise((resolve, reject) => {
  const connection = mongoose.connection
  const timeout = setTimeout(() => {
    cleanup()
    reject(new Error('Timed out waiting for MongoDB connection'))
  }, 10000)

  const cleanup = () => {
    clearTimeout(timeout)
    connection.removeListener('connected', onConnected)
    connection.removeListener('error', onError)
  }
  const onConnected = () => {
    cleanup()
    resolve()
  }
  const onError = (error) => {
    cleanup()
    reject(error)
  }

  connection.once('connected', onConnected)
  connection.once('error', onError)
})

export async function ensureMongoConnection() {
  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!connectionPromise) {
    const config = useRuntimeConfig().mongoose
    const uri = config.uri

    if (!uri || !uri.trim()) {
      throw new Error('MongoDB URI is not configured')
    }

    connectionPromise = mongoose.connection.readyState === 2
      ? waitForConnection()
      : mongoose.connect(uri, config.options)
  }

  try {
    await connectionPromise
  } finally {
    connectionPromise = undefined
  }
}
