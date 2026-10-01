import { HttpError } from '../utils/http.js'

export function notFoundMiddleware(req, res) {
  const message = req.path.startsWith('/api/') ? 'API endpoint not found.' : 'Endpoint not found.'
  res.status(404).json({ message })
}

export function errorMiddleware(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' })
  }
  if (error.status === 413) return res.status(413).json({ message: 'Request body is too large.' })
  if (error.message === 'Origin not allowed by CORS') return res.status(403).json({ message: 'This frontend origin is not allowed.' })
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message })
  if (process.env.NODE_ENV !== 'production') console.error(error)
  return res.status(500).json({ message: 'Something went wrong. Please try again.' })
}
