import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { loadStripe } from "@stripe/stripe-js";
import './Login.css'

const stripePromise = loadStripe("pk_live_51OYpnXJltAvlqMW0lvzXGgiceH7JESMMrN6fIdWvituZhKdiBVETqwXTUUFRDGzwherXVuDwLTSggnUGaWqvq5Xu00iWKqq9dA"); // public key dashboardista

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const wantsPremium = location.state?.wantsPremium || false

  const handleLogin = async (e) => {
    e.preventDefault()

    const res = await fetch('http://127.0.0.1:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      alert("Virheellinen kirjautuminen")
      return
    }

    const data = await res.json()
    localStorage.setItem("token", data.access_token)

    if (wantsPremium) {
      // Luo Stripe Checkout session
      const stripe = await stripePromise
      const checkoutRes = await fetch("http://127.0.0.1:8000/create-checkout-session", {
        method: "POST",
        headers: { "Authorization": `Bearer ${data.access_token}` },
      })
      const session = await checkoutRes.json()
      await stripe.redirectToCheckout({ sessionId: session.id })
    } else {
      navigate('/home') // normikäyttäjä ohjataan kotisivulle
    }
  }

  return (
    <div className="login-container">
      <h2>Kirjaudu sisään</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Sähköposti" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Salasana" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Kirjaudu</button>
        <p>Eikö sinulla ole tunnusta? <Link to="/register">Rekisteröidy</Link></p>
      </form>
    </div>
  )
      
   
  
}

export default Login
