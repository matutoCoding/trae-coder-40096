import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import Instruments from "@/pages/Instruments"
import InstrumentDetail from "@/pages/InstrumentDetail"
import Booking from "@/pages/Booking"
import Bookings from "@/pages/Bookings"
import Waitlist from "@/pages/Waitlist"
import WaitlistRegister from "@/pages/WaitlistRegister"
import Notifications from "@/pages/Notifications"
import BillingRates from "@/pages/BillingRates"
import BillingBills from "@/pages/BillingBills"
import BillDetail from "@/pages/BillDetail"
import AdminInstruments from "@/pages/AdminInstruments"
import AdminWaitlist from "@/pages/AdminWaitlist"
import Profile from "@/pages/Profile"
import { useBackgroundTasks } from "@/hooks/useBackgroundTasks"

function AppContent() {
  useBackgroundTasks()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/instruments" element={<Instruments />} />
        <Route path="/instruments/:id" element={<InstrumentDetail />} />
        <Route path="/booking" element={<Bookings />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/waitlist/register/:id" element={<WaitlistRegister />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/billing/rates" element={<BillingRates />} />
        <Route path="/billing/bills" element={<BillingBills />} />
        <Route path="/billing/bills/:id" element={<BillDetail />} />
        <Route path="/admin/instruments" element={<AdminInstruments />} />
        <Route path="/admin/waitlist" element={<AdminWaitlist />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
