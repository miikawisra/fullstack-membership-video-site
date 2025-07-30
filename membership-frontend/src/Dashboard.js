// Dashboard.js
import React from 'react'
import './Dashboard.css'

function Dashboard({ onLogout }) {
  const freeVideo = '/videos/free1.mp4'
  const premiumVideo = '/videos/premium1.mp4'

  return (
    
  <div className="dashboard-container"> {/* Tämä pitää olla oikein */}
    <header className="dashboard-header">
      <h2>Tervetuloa</h2>
      <h2>Fartsite.online</h2>
      <button onClick={onLogout}>Kirjaudu ulos</button>
    </header>
    <div className="video-grid">
      <div className="video-box">
        <h3>Ilmainen sisältö</h3>
        <video controls width="100%">
          <source src={freeVideo} type="video/mp4" />
          Selaimesi ei tue videon toistoa.
        </video>
      </div>

      <div className="video-box premium-blur">
        <h3>Premium sisältö</h3>
        <video muted width="100%">
          <source src={premiumVideo} type="video/mp4" />
          Selaimesi ei tue videon toistoa.
        </video>
        <div className="overlay">Vain jäsenille</div>
      </div>
    </div>

    
    </div>
  )
}

export default Dashboard
