import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_URL = import.meta.env.VITE_API_AUTH_URL || '/api/auth'

const authFetch = async (path, options = {}) => {
  // Ưu tiên gọi qua proxy
  try {
    return await fetch(`${API_URL}${path}`, options)
  } catch (err) {
    // Fallback khi proxy dev lỗi (backend chạy cổng trực tiếp)
    const fallbackPorts = [5000, 5001]
    for (const port of fallbackPorts) {
      try {
        return await fetch(`http://localhost:${port}/api/auth${path}`, options)
      } catch {
        // thử port tiếp theo
      }
    }
    throw err
  }
}

const parseResponse = async (response) => {
  try {
    return await response.json()
  } catch {
    return {
      success: false,
      message: `HTTP ${response.status} - Không đọc được dữ liệu phản hồi`
    }
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  })

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await authFetch('/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await parseResponse(response)
        setUser(result.data)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authFetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const result = await parseResponse(response)

      if (result.success) {
        const { user, token } = result.data
        setUser(user)
        setToken(token)
        localStorage.setItem('token', token)
        return { success: true, user }
      }

      return { success: false, message: result.message || 'Đăng nhập thất bại' }
    } catch {
      return { success: false, message: 'Không kết nối được máy chủ. Vui lòng kiểm tra backend.' }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await authFetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })

      const result = await parseResponse(response)

      if (result.success) {
        const { user, token } = result.data
        setUser(user)
        setToken(token)
        localStorage.setItem('token', token)
        return { success: true }
      }

      return { success: false, message: result.message || 'Đăng ký thất bại' }
    } catch {
      return { success: false, message: 'Không kết nối được máy chủ. Vui lòng kiểm tra backend.' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
