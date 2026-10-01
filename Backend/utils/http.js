export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function routeId(value, label = 'ID') {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, `${label} must be a positive integer.`)
  return id
}

export function requireFields(values, message) {
  if (!values.every((value) => typeof value === 'string' && value.trim())) throw new HttpError(400, message)
}
