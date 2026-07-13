import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">📚</div>
                    <h1 className="text-3xl font-bold text-white">StudyMate AI</h1>
                    <p className="text-indigo-300 mt-1">Your intelligent study companion</p>
                </div>
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-indigo-200 text-sm font-medium block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            required
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                        <label className="text-indigo-200 text-sm font-medium block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-indigo-300 mt-6 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-400 hover:text-white font-medium transition-colors">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    )
}