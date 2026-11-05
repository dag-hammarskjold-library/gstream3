// Basic server health check
export default defineEventHandler(async (event) => {
  try {
    // You can add more complex health checks here if needed
    return { status: 'ok', message: 'Server is healthy' }
  } catch (error) {
    return { status: 'error', message: 'Server health check failed', error: error.message }
  }
})