import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ToastProvider } from './components/Toast'
import AppLayout from './layouts/AppLayout'

const Home = lazy(() => import('./pages/Home'))
const Rooms = lazy(() => import('./pages/Rooms'))
const RoomDetail = lazy(() => import('./pages/RoomDetail'))
const Search = lazy(() => import('./pages/Search'))
const Budget = lazy(() => import('./pages/Budget'))
const MoodBoard = lazy(() => import('./pages/MoodBoard'))
const ShareTarget = lazy(() => import('./pages/ShareTarget'))

export default function App() {
  return (
    <CurrencyProvider>
    <ToastProvider>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <Routes>
          <Route path="/share" element={<ShareTarget />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:slug" element={<RoomDetail />} />
            <Route path="/mood-board" element={<MoodBoard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/budget" element={<Budget />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ToastProvider>
    </CurrencyProvider>
  )
}
