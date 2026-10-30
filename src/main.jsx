import './i18n.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlanProvider } from './context/PlanContext.jsx'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <App />
      </PlanProvider>
    </QueryClientProvider>
  </StrictMode>,
)
