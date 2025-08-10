import React, { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'

function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token)
        setIsPremiumUser(decoded.premium)
      } catch (error) {
        setIsPremiumUser(false)
      }
    }
  }, [])

  useEffect(() => {
    async function fetchVideos() {
      try {
        const token = localStorage.getItem('token')
        console.log("Tokenista haettu:", token)
        const response = await fetch('http://127.0.0.1:8000/api/videos', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await response.json()
        setVideos(Array.isArray(data) ? data : data.videos || [])
      } catch (error) {
        console.error("Virhe videoiden haussa:", error)
      }
    }
    fetchVideos()
  }, [])

  useEffect(() => {
    const premiumVideos = Array.isArray(videos) ? videos.filter(v => Boolean(v.is_premium)) : []
    console.log("Videos:", videos)
    console.log("Premium videos:", premiumVideos)
    console.log("Is premium user?", isPremiumUser)
  }, [videos, isPremiumUser])



  const freeVideos = Array.isArray(videos) ? videos.filter(v => !v.is_premium) : []
  const premiumVideos = Array.isArray(videos) ? videos.filter(v => Boolean(v.is_premium)) : []


  

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h2 className="fart" style={{ textAlign: 'center', width: '100%', color: 'white' }}>
            Fartsite.online
          </h2>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => navigate('/premium-post')}>Lisää uusi video</button>
          <button onClick={onLogout}>Kirjaudu ulos</button>
        </div>
      </header>
      
      <div className="video-grid">
        <div className="video-column free">
          <h3>Ilmainen sisältö</h3>
          {freeVideos.map(video => (
            <div key={video.id} className="video-box">
              <h3>{video.title}</h3>
              <video controls width="100%">
                <source
                  src={`http://127.0.0.1:8000/videos/${encodeURIComponent(video.filename)}`}
                  type="video/mp4"
                />
              </video>
            </div>
          ))}
        </div>

        <div className="video-column premium">
          <h3>Premium sisältö</h3>
          {premiumVideos.map(video => (
  <div key={video.id} className="video-box">
    <h3>{video.title}</h3>
    <div className="video-overlay-wrapper" style={{ position: 'relative' }}>
      <video controls={isPremiumUser} width="100%">
        <source
          src={`http://127.0.0.1:8000/videos/${encodeURIComponent(video.filename)}`}
          type="video/mp4"
        />
      </video>
      {!isPremiumUser && (
        <div className="overlay">
          Vain jäsenille
        </div>
      )}
    </div>
  </div>
))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
