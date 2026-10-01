import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartFoodToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('smartFoodToken')
    localStorage.removeItem('smartFoodCurrentUser')
    if (window.location.pathname !== '/login') window.location.replace('/login')
  }
  return Promise.reject(error)
})

export default api
