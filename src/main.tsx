import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/styles/globals.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

const mount = async () => {
  const [{ default: App }, { initNativeShell }] = await Promise.all([import('@/App'), import('@/lib/app-shell')])
  void initNativeShell()
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void mount()
