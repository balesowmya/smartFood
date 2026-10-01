import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (!localStorage.getItem('smartFoodToken')) {
        localStorage.removeItem('smartFoodCurrentUser')
        return null
      }
      return JSON.parse(localStorage.getItem('smartFoodCurrentUser') || 'null')
    } catch { return null }
  })

  useEffect(() => { localStorage.removeItem('smartFoodUsers') }, [])

  async function register(userDetails) {
    const response = await api.post('/auth/register', userDetails)
    return response.data
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    if (!data.token || !data.user) throw new Error('The server returned an incomplete sign-in response.')
    localStorage.setItem('smartFoodToken', data.token)
    localStorage.setItem('smartFoodCurrentUser', JSON.stringify(data.user))
    setCurrentUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem('smartFoodToken')
    localStorage.removeItem('smartFoodCurrentUser')
    setCurrentUser(null)
  }

  return <AuthContext.Provider value={{ currentUser, isLoggedIn: Boolean(currentUser), register, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
