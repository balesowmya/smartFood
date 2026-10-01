export function getApiError(error, fallback = 'Smart Food request failed without a server message. Please try again.') {
  if (!error.response) {
    const apiUrl = import.meta.env.VITE_API_URL || 'the configured API URL'
    return `Network error: Could not reach ${apiUrl}. Check that the backend is running and allows this frontend origin.`
  }
  const status = error.response.status
  const message = error.response.data?.message
  if (status === 400) return `Please check your entries. ${message || 'The request was invalid.'}`
  if (status === 401) return message || 'Invalid email or password.'
  if (status === 403) return message || 'You do not have access to this feature.'
  if (status === 404) return message || 'We could not find what you requested.'
  if (status === 409) return message || 'An account with this email already exists.'
  if (status >= 500) return `Server error: ${message || 'Smart Food could not complete the request. Please try again.'}`
  return message || fallback
}
