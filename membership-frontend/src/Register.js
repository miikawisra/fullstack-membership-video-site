// Register.js
import React, { useState } from 'react'
import './Register.css'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Salasanat eivät täsmää")
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        alert('Rekisteröinti onnistui!')
        navigate('/') // takaisin login-sivulle
      } else {
        alert('Rekisteröinti epäonnistui')
      }
    } catch (error) {
      console.error('Register error:', error)
      alert('Virhe rekisteröinnissä')
    }
  }

  return (
    <div className="register-container">
      <h2>Luo tunnus</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Salasana"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Vahvista salasana"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Rekisteröidy</button>
      </form>
      <p>Onko sinulla jo tunnus? <Link to="/">Kirjaudu</Link></p>
    </div>
  )
}

export default Register
