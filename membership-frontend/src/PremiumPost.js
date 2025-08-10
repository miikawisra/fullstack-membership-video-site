import React, { useState } from 'react'
import './PremiumPost.css'
import { useNavigate } from 'react-router-dom'



function PremiumPost() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('title', title)
    formData.append('video', file)

    const response = await fetch('http://127.0.0.1:8000/api/videos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })

    if (response.ok) {
      alert('Video lisätty onnistuneesti!')
      navigate('/dashboard')  // ohjaa dashboardiin
    } else {
      alert('Virhe videon lisäyksessä')
    }
  }

  return (
     <div className="post-container">
        <form onSubmit={handleSubmit}>
        <input
            type="text"
            placeholder="Otsikko"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
        />
        <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Lähetä video</button>
        </form>
    </div>
  )
}

export default PremiumPost
