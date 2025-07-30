// Login.js
import React, { useState } from 'react'
import './Login.css'
import { Link } from 'react-router-dom'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (email && password) {
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        alert('Virheellinen sähköposti tai salasana')
        return
      }

      const data = await response.json()
      onLoginSuccess(data.access_token)
    } catch (error) {
      console.error('Login error:', error)
      alert('Virhe kirjautumisessa')
    }
  }
}


  return (
    <div className="login-container">
      <h2>Kirjaudu sisään</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Salasana"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Kirjaudu</button>
      </form>
      <p>Eikö sinulla ole tunnusta? <Link to="/register">Rekisteröidy</Link></p>
    </div>
  )
}

export default Login
