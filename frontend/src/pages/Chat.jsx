import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

let socket;

export default function Chat() {
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const [conversations, setConversations] = useState([])
    const [selectedFriend, setSelectedFriend] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    const messagesEndRef = useRef(null)
    const typingTimeoutRef = useRef(null)
    const selectedFriendRef = useRef(null)

    // Keep ref in sync so socket callbacks can read latest value
    useEffect(() => {
        selectedFriendRef.current = selectedFriend
    }, [selectedFriend])

    useEffect(() => {
        initSocket()
        fetchConversations()

        return () => {
            if (socket) socket.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // If navigated from Friends page with a friend to open
    useEffect(() => {
        if (location.state?.openFriend) {
            selectFriend(location.state.openFriend)
            // Clear the state so it doesn't re-trigger
            window.history.replaceState({}, '')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const initSocket = () => {
        const token = localStorage.getItem('token')
        socket = io('http://localhost:5000', { auth: { token } })

        socket.on('receive_message', (message) => {
            const currentFriend = selectedFriendRef.current
            if (currentFriend && (message.sender._id === currentFriend._id || message.sender === currentFriend._id)) {
                setMessages(prev => [...prev, message])
                socket.emit('mark_read', { senderId: message.sender._id || message.sender })
            }
            fetchConversations()
        })

        socket.on('message_sent', (message) => {
            setMessages(prev => [...prev, message])
            fetchConversations()
        })

        socket.on('user_online', ({ userId }) => {
            setOnlineUsers(prev => new Set([...prev, userId]))
        })

        socket.on('user_offline', ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        })

        socket.on('user_typing', ({ userId }) => {
            if (selectedFriendRef.current?._id === userId) setIsTyping(true)
        })

        socket.on('user_stop_typing', ({ userId }) => {
            if (selectedFriendRef.current?._id === userId) setIsTyping(false)
        })

        socket.on('messages_read', () => {
            setMessages(prev => prev.map(m => ({ ...m, read: true })))
        })
    }

    const fetchConversations = async () => {
        try {
            const res = await api.get('/friends/conversations')
            setConversations(res.data)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const fetchMessages = async (friendId) => {
        try {
            const res = await api.get(`/friends/messages/${friendId}`)
            setMessages(res.data)
            if (socket) socket.emit('mark_read', { senderId: friendId })
        } catch (err) { console.error(err) }
    }

    const selectFriend = (friend) => {
        setSelectedFriend(friend)
        setIsTyping(false)
        fetchMessages(friend._id)
    }

    const sendMessage = () => {
        if (!newMessage.trim() || !selectedFriend || !socket) return
        socket.emit('send_message', {
            recipientId: selectedFriend._id,
            content: newMessage.trim()
        })
        setNewMessage('')
        socket.emit('stop_typing', { recipientId: selectedFriend._id })
    }

    const handleTyping = (e) => {
        setNewMessage(e.target.value)
        if (!socket || !selectedFriend) return
        socket.emit('typing', { recipientId: selectedFriend._id })
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { recipientId: selectedFriend._id })
        }, 1500)
    }

    const isOnline = (userId) => onlineUsers.has(userId?.toString())

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Never'
        const diff = Math.floor((new Date() - new Date(lastSeen)) / 1000)
        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        })
    }

    const formatDate = (date) => {
        const d = new Date(date)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (d.toDateString() === today.toDateString()) return 'Today'
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.createdAt)
        if (!groups[date]) groups[date] = []
        groups[date].push(msg)
        return groups
    }, {})

    const filteredConversations = conversations.filter(conv =>
        !searchQuery || conv.friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

    return (
        <Layout>
            <div className="flex h-[calc(100vh-0px)] overflow-hidden">

                {/* Left Panel — Conversations List */}
                <div className="w-[340px] border-r border-white/10 flex flex-col bg-indigo-950/40">

                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-white font-bold text-xl flex items-center gap-2">
                                💬 Chats
                                {totalUnread > 0 && (
                                    <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>
                                )}
                            </h1>
                            <button
                                onClick={() => navigate('/friends')}
                                className="text-indigo-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                👥 Friends
                            </button>
                        </div>
                        {/* Search conversations */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">🔍</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p className="text-indigo-400 text-sm text-center py-8">Loading chats...</p>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <p className="text-4xl mb-3">💬</p>
                                <p className="text-white font-semibold mb-1">No conversations yet</p>
                                <p className="text-indigo-400 text-sm mb-4">Add friends to start chatting!</p>
                                <button
                                    onClick={() => navigate('/friends')}
                                    className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white text-sm px-4 py-2 rounded-lg transition-all"
                                >
                                    Find Friends
                                </button>
                            </div>
                        ) : (
                            filteredConversations.map((conv, i) => {
                                const friendOnline = conv.friend.isOnline || isOnline(conv.friend._id)
                                const isSelected = selectedFriend?._id === conv.friend._id
                                return (
                                    <div
                                        key={conv.friend._id || i}
                                        onClick={() => selectFriend(conv.friend)}
                                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-2 ${isSelected
                                            ? 'bg-indigo-500/15 border-l-indigo-400'
                                            : 'border-l-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                                {conv.friend.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-indigo-950 ${friendOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-indigo-100'}`}>
                                                    {conv.friend.name}
                                                </p>
                                                {conv.lastMessage && (
                                                    <p className="text-indigo-400 text-xs flex-shrink-0 ml-2">{formatTime(conv.lastMessage.createdAt)}</p>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-indigo-200 font-medium' : 'text-indigo-400'}`}>
                                                    {conv.lastMessage
                                                        ? conv.lastMessage.content
                                                        : friendOnline ? '🟢 Online' : `Last seen ${formatLastSeen(conv.friend.lastSeen)}`}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-indigo-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel — Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {selectedFriend ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4 bg-indigo-950/30 flex-shrink-0">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                        {selectedFriend.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-indigo-950 ${selectedFriend.isOnline || isOnline(selectedFriend._id) ? 'bg-green-400' : 'bg-gray-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold">{selectedFriend.name}</p>
                                    <p className="text-xs text-indigo-400">
                                        {isTyping
                                            ? <span className="text-green-400">typing...</span>
                                            : selectedFriend.isOnline || isOnline(selectedFriend._id)
                                                ? '🟢 Online'
                                                : `Last seen ${formatLastSeen(selectedFriend.lastSeen)}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/friends')}
                                    className="text-indigo-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
                                            👋
                                        </div>
                                        <p className="text-white font-semibold text-lg mb-1">Say hello to {selectedFriend.name}!</p>
                                        <p className="text-indigo-400 text-sm">Start the conversation by sending a message below.</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedMessages).map(([date, msgs]) => (
                                        <div key={date}>
                                            {/* Date separator */}
                                            <div className="flex items-center justify-center my-4">
                                                <div className="flex-1 border-t border-white/5" />
                                                <span className="px-3 text-indigo-400 text-xs">{date}</span>
                                                <div className="flex-1 border-t border-white/5" />
                                            </div>
                                            {/* Messages for this date */}
                                            <div className="space-y-2">
                                                {msgs.map((msg, i) => {
                                                    const isMine = msg.sender._id === user._id || msg.sender === user._id
                                                        || msg.sender._id === user.id || msg.sender === user.id
                                                    return (
                                                        <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl ${isMine
                                                                ? 'bg-indigo-500 text-white rounded-br-md'
                                                                : 'bg-white/10 text-white rounded-bl-md'
                                                                }`}
                                                            >
                                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                                <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                                    <p className="text-[11px] opacity-50">{formatTime(msg.createdAt)}</p>
                                                                    {isMine && (
                                                                        <span className="text-[11px] opacity-50">
                                                                            {msg.read ? '✓✓' : '✓'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start mt-2">
                                        <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                                            <div className="flex gap-1 items-center h-4">
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleTyping}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        placeholder={`Message ${selectedFriend.name}...`}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-colors"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-colors"
                                    >
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center text-5xl mx-auto mb-5">
                                    💬
                                </div>
                                <p className="text-white font-semibold text-xl mb-2">Your messages</p>
                                <p className="text-indigo-400 text-sm mb-5 max-w-xs mx-auto">
                                    Select a conversation from the left or start chatting with a friend.
                                </p>
                                <button
                                    onClick={() => navigate('/friends')}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
                                >
                                    👥 Find Friends
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
