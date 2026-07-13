import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/planner', icon: '📅', label: 'Study Planner' },
    { path: '/assignments', icon: '📝', label: 'Assignments' },
    { path: '/progress', icon: '📊', label: 'Progress' },
    { path: '/habits', icon: '✅', label: 'Habit Tracker' },
    { path: '/notes', icon: '📚', label: 'Notes Marketplace' },
    { path: '/groups', icon: '👥', label: 'Study Groups' },
    { path: '/friends', icon: '👥', label: 'Friends' },
    { path: '/chat', icon: '💬', label: 'Chat' },
    { path: '/game', icon: '🎮', label: 'Boss Battle' },
    { path: '/assistant', icon: '🤖', label: 'AI Assistant' },
    { path: '/weekly-report', icon: '📋', label: 'Weekly Report' },
    { path: '/pomodoro', icon: '⏱️', label: 'Pomodoro Timer' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="w-64 min-h-screen bg-indigo-950/80 backdrop-blur border-r border-white/10 flex flex-col">

            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <span className="text-white font-bold text-lg">StudyMate AI</span>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white text-sm font-medium">{user?.name}</p>
                        <p className="text-indigo-400 text-xs capitalize">{user?.role}</p>
                    </div>
                </div>
                {/* XP / Coins / Streak */}
                <div className="flex gap-2 mt-3">
                    <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">⚡ {user?.xp} XP</span>
                    <span className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1 rounded-full">🪙 {user?.coins}</span>
                    <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full">🔥 {user?.streak}</span>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === item.path
                            ? 'bg-indigo-500 text-white font-medium'
                            : 'text-indigo-300 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}