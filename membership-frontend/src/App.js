import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'



function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setToken(savedToken)
  }, [])

  const handleLoginSuccess = (newToken) => {
    setToken(newToken)
    localStorage.setItem("token", newToken)
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem("token")
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          token ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
