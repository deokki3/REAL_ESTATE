import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AnnouncementListPage } from './features/announcements/AnnouncementListPage'
import { AnnouncementDetailPage } from './features/announcements/AnnouncementDetailPage'
import { LeaseCalculatorPage } from './features/calculator/LeaseCalculatorPage'
import { SaleCalculatorPage } from './features/calculator/SaleCalculatorPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<AnnouncementListPage />} />
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
        <Route path="/calculator/lease" element={<LeaseCalculatorPage />} />
        <Route path="/calculator/sale" element={<SaleCalculatorPage />} />
      </Route>
    </Routes>
  )
}

export default App
