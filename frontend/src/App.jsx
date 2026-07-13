import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Assignments from './pages/Assignments'
import HabitTracker from './pages/HabitTracker'
import StudyPlanner from './pages/StudyPlanner'
import Progress from './pages/Progress'
import WeeklyReport from './pages/WeeklyReport'
import Pomodoro from './pages/Pomodoro'
import AIAssistant from './pages/AIAssistant'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-white bg-indigo-950">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
      <Route path="/weekly-report" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App