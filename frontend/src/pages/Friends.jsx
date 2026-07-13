import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Friends() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tab, setTab] = useState('all')
    const [friends, setFriends] = useState([])
    const [pending, setPending] = useState([])
    const [recommendations, setRecommendations] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [mutualCounts, setMutualCounts] = useState({})

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        setLoading(true)
        await Promise.all([fetchFriends(), fetchPending(), fetchRecommendations()])
        setLoading(false)
    }

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends')
            setFriends(res.data)
        } catch (err) { console.error(err) }
    }

    const fetchPending = async () => {
        try {
            const res = await api.get('/friends/pending')
            setPending(res.data)
        } catch (err) { console.error(err) }
    }

    const fetchRecommendations = async () => {
        try {
            const res = await api.get('/friends/recommendations')
            setRecommendations(res.data)
        } catch (err) { console.error(err) }
    }

    const handleSearch = async (e) => {
        const q = e.target.value
        setSearchQuery(q)
        if (q.length < 2) return setSearchResults([])
        try {
            const res = await api.get(`/friends/search?query=${q}`)
            setSearchResults(res.data)
        } catch (err) { console.error(err) }
    }

    const sendRequest = async (recipientId) => {
        try {
            await api.post('/friends/request', { recipientId })
            setSearchResults(prev => prev.filter(u => u._id !== recipientId))
            setRecommendations(prev => prev.filter(u => u._id !== recipientId))
            fetchPending()
        } catch (err) {
            alert(err.response?.data?.message || 'Error sending request')
        }
    }

    const respondRequest = async (requestId, action) => {
        try {
            await api.put('/friends/respond', { requestId, action })
            fetchPending()
            fetchFriends()
        } catch (err) { console.error(err) }
    }

    const removeFriend = async (friendId) => {
        if (!confirm('Remove this friend?')) return
        try {
            await api.delete(`/friends/${friendId}`)
            fetchFriends()
        } catch (err) { console.error(err) }
    }

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Never'
        const diff = Math.floor((new Date() - new Date(lastSeen)) / 1000)
        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const TABS = [
        { key: 'all', label: 'All Friends', count: friends.length },
        { key: 'pending', label: 'Friend Requests', count: pending.length },
        { key: 'find', label: 'Find Friends', count: null },
    ]

    return (
        <Layout>
            <div className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">👥 Friends</h1>
                        <p className="text-indigo-300">Connect with fellow students and study together.</p>
                    </div>
                    <button
                        onClick={() => navigate('/chat')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
                    >
                        💬 Open Chat
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${tab === t.key
                                ? 'border-indigo-400 text-white'
                                : 'border-transparent text-indigo-300 hover:text-white'
                                }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.key ? 'bg-indigo-500 text-white' : 'bg-white/10 text-indigo-300'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading && <p className="text-indigo-300 text-center py-12">Loading...</p>}

                {/* All Friends Tab */}
                {!loading && tab === 'all' && (
                    <div>
                        {friends.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-5xl mb-4">👥</p>
                                <p className="text-white text-lg font-semibold mb-1">No friends yet</p>
                                <p className="text-indigo-400 text-sm mb-4">Find classmates and study buddies to connect with!</p>
                                <button
                                    onClick={() => setTab('find')}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    Find Friends
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {friends.map(friend => (
                                    <div key={friend._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group">
                                        {/* Cover bar */}
                                        <div className="h-20 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 relative">
                                            <div className="absolute -bottom-8 left-5">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-950">
                                                        {friend.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-3 border-indigo-950 ${friend.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-10 px-5 pb-5">
                                            <h3 className="text-white font-semibold text-base">{friend.name}</h3>
                                            <p className="text-indigo-400 text-xs mb-1">{friend.email}</p>
                                            <p className="text-xs mb-4">
                                                {friend.isOnline
                                                    ? <span className="text-green-400">🟢 Online now</span>
                                                    : <span className="text-indigo-400">Last seen {formatLastSeen(friend.lastSeen)}</span>
                                                }
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate('/chat', { state: { openFriend: friend } })}
                                                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    💬 Message
                                                </button>
                                                <button
                                                    onClick={() => removeFriend(friend._id)}
                                                    className="px-3 py-2 rounded-lg bg-white/5 text-indigo-300 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
                                                    title="Remove friend"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending Requests Tab */}
                {!loading && tab === 'pending' && (
                    <div>
                        {pending.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-5xl mb-4">📩</p>
                                <p className="text-white text-lg font-semibold mb-1">No pending requests</p>
                                <p className="text-indigo-400 text-sm">When someone sends you a friend request, it will show up here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pending.map(req => (
                                    <div key={req._id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-indigo-500/20 transition-all">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                {req.requester.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-indigo-950 ${req.requester.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold">{req.requester.name}</p>
                                            <p className="text-indigo-400 text-xs">{req.requester.email}</p>
                                            <p className="text-indigo-400 text-xs mt-0.5">
                                                {req.requester.isOnline ? '🟢 Online' : `Last seen ${formatLastSeen(req.requester.lastSeen)}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondRequest(req._id, 'accept')}
                                                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-lg transition-colors font-medium"
                                            >
                                                ✓ Accept
                                            </button>
                                            <button
                                                onClick={() => respondRequest(req._id, 'reject')}
                                                className="bg-white/5 hover:bg-red-500/20 text-indigo-300 hover:text-red-400 text-sm px-5 py-2.5 rounded-lg transition-colors"
                                            >
                                                ✕ Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Find Friends Tab */}
                {!loading && tab === 'find' && (
                    <div>
                        {/* Search bar */}
                        <div className="mb-8">
                            <div className="relative max-w-xl">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">🔍</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Search by name or email..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                    🔍 Search Results
                                    <span className="text-indigo-400 text-sm font-normal">({searchResults.length} found)</span>
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {searchResults.map(u => (
                                        <div key={u._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-500/20 transition-all">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-indigo-950 ${u.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{u.name}</p>
                                                <p className="text-indigo-400 text-xs truncate">{u.email}</p>
                                            </div>
                                            <button
                                                onClick={() => sendRequest(u._id)}
                                                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap"
                                            >
                                                + Add Friend
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* People you may know */}
                        <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                ✨ People You May Know
                            </h3>
                            {recommendations.length === 0 ? (
                                <p className="text-indigo-400 text-sm text-center py-8">No suggestions right now. Try searching above!</p>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recommendations.map(u => (
                                        <div key={u._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all">
                                            {/* Mini cover */}
                                            <div className="h-16 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 relative">
                                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold border-4 border-indigo-950">
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-indigo-950 ${u.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-9 px-4 pb-4 text-center">
                                                <p className="text-white font-semibold text-sm">{u.name}</p>
                                                <p className="text-indigo-400 text-xs mb-3">
                                                    {u.isOnline ? '🟢 Online' : `Last seen ${formatLastSeen(u.lastSeen)}`}
                                                </p>
                                                <button
                                                    onClick={() => sendRequest(u._id)}
                                                    className="w-full bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white text-sm py-2 rounded-lg transition-all font-medium border border-indigo-500/30"
                                                >
                                                    + Add Friend
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
