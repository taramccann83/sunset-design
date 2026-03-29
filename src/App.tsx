import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CurrencyProvider } from './contexts/CurrencyContext'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import Search from './pages/Search'
import Budget from './pages/Budget'
import MoodBoard from './pages/MoodBoard'
import ShareTarget from './pages/ShareTarget'

export default function App() {
  return (
    <CurrencyProvider>
    <BrowserRouter>
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
    </BrowserRouter>
    </CurrencyProvider>
  )
}
