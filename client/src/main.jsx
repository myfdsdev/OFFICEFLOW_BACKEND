import React from 'react'
import ReactDOM from 'react-dom/client'
// Add a leading dot if the alias is still giving you trouble, 
// but with the fixed vite.config.js, @/App.jsx is fine!
import App from '@/App.jsx' 
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)