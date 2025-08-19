import React, { useState } from 'react'
import './Register.css'
import { useNavigate, Link } from 'react-router-dom'
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_live_51OYpnXJltAvlqMW0lvzXGgiceH7JESMMrN6fIdWvituZhKdiBVETqwXTUUFRDGzwherXVuDwLTSggnUGaWqvq5Xu00iWKqq9dA");

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [wantsPremium, setWantsPremium] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Salasanat eivät täsmää")
      return
    }

    try {
      // 1. Rekisteröinti
      const registerRes = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!registerRes.ok) {
        alert('Rekisteröinti epäonnistui')
        return
      }

      alert('Rekisteröinti onnistui!')

      // 2. Automaattinen login tokenin saamiseksi
      const loginRes = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!loginRes.ok) {
        alert('Login epäonnistui')
        return
      }

      const loginData = await loginRes.json()
      const token = loginData.access_token
      localStorage.setItem("token", token)

      // 3. Premium-valinta → Stripe Checkout
      if (wantsPremium) {
        const res = await fetch("http://localhost:8000/create-checkout-session", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        })

        if (!res.ok) {
          alert("Stripe-session luonti epäonnistui")
          return
        }

        const data = await res.json()
        const stripe = await stripePromise
        await stripe.redirectToCheckout({ sessionId: data.id })
      } else {
        // Ei premium → takaisin login-sivulle
        navigate('/')
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

        <div className="register_premium">
          <input
            type="checkbox"
            id="premium-checkbox"
            checked={wantsPremium}
            onChange={(e) => setWantsPremium(e.target.checked)}
          />
          <label htmlFor="premium-checkbox">Haluan premiumin (1€)</label>
        </div>

        <button className="premium_button" type="submit">Rekisteröidy</button>
      </form>

      <p>Onko sinulla jo tunnus? <Link to="/">Kirjaudu</Link></p>
    </div>
  )
}

export default Register
