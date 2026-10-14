import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { bootstrapSiteTheme } from './theme/siteTheme'

// Apply the seasonal theme before first paint (avoids a flash of the wrong theme)
bootstrapSiteTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
