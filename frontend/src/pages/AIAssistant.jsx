import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const SUGGESTIONS = [
    'Explain photosynthesis simply',
    'Give me 5 quiz questions on calculus',
    'Summarise the French Revolution',
    'What are the best study techniques?',
    'Help me understand Newton\'s laws',
    'Create a revision checklist for exams',
]

// Lightweight markdown renderer — no extra packages needed
function renderMarkdown(text) {
    const lines = text.split('\n')
    const elements = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]

        // H3
        if (line.startsWith('### ')) {
            elements.push(
                <h3 key={i} className="text-white font-bold text-sm mt-3 mb-1">
                    {inlineFormat(line.slice(4))}
                </h3>
            )
        }
        // H2
        else if (line.startsWith('## ')) {
            elements.push(
                <h2 key={i} className="text-white font-bold text-base mt-3 mb-1">
                    {inlineFormat(line.slice(3))}
                </h2>
            )
        }
        // Bullet
        else if (line.startsWith('* ') || line.startsWith('- ')) {
            elements.push(
                <li key={i} className="ml-4 list-disc text-indigo-100">
                    {inlineFormat(line.slice(2))}
                </li>
            )
        }
        // Numbered list
        else if (/^\d+\.\s/.test(line)) {
            elements.push(
                <li key={i} className="ml-4 list-decimal text-indigo-100">
                    {inlineFormat(line.replace(/^\d+\.\s/, ''))}
                </li>
            )
        }
        // Horizontal rule
        else if (line.trim() === '---' || line.trim() === '***') {
            elements.push(<hr key={i} className="border-white/20 my-2" />)
        }
        // Empty line
        else if (line.trim() === '') {
            elements.push(<div key={i} className="h-1" />)
        }
        // Normal paragraph
        else {
            elements.push(
                <p key={i} className="text-indigo-100 leading-relaxed">
                    {inlineFormat(line)}
                </p>
            )
        }
        i++
    }
    return elements
}

// Handle **bold**, *italic*, `code`, and $math$ inline
function inlineFormat(text) {
    // Split by bold, italic, code, math patterns
    const parts = []
    // Combined regex for **bold**, *italic*, `code`, $math$
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\$(.+?)\$)/g
    let last = 0
    let match

    while ((match = regex.exec(text)) !== null) {
        // Text before match
        if (match.index > last) {
            parts.push(text.slice(last, match.index))
        }
        if (match[0].startsWith('**')) {
            parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>)
        } else if (match[0].startsWith('*')) {
            parts.push(<em key={match.index} className="text-indigo-200 italic">{match[3]}</em>)
        } else if (match[0].startsWith('`')) {
            parts.push(<code key={match.index} className="bg-black/30 text-green-300 px-1 rounded text-xs font-mono">{match[4]}</code>)
        } else if (match[0].startsWith('$')) {
            // Render math — convert subscripts like H_2O, CO_2
            const mathText = match[5].replace(/_\{?(\w+)\}?/g, (_, sub) => {
                return sub.split('').map(c => String.fromCharCode(0x2080 + parseInt(c)) || c).join('')
            })
            parts.push(<span key={match.index} className="text-yellow-300 font-mono">{mathText}</span>)
        }
        last = match.index + match[0].length
    }

    if (last < text.length) {
        parts.push(text.slice(last))
    }

    return parts.length > 0 ? parts : text
}

function Message({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isUser ? 'bg-indigo-500' : 'bg-purple-600'}`}>
                {isUser ? '👤' : '🤖'}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm space-y-1 ${isUser
                ? 'bg-indigo-500 text-white rounded-tr-sm'
                : 'bg-white/10 rounded-tl-sm border border-white/10'
                }`}>
                {isUser
                    ? <p className="text-white leading-relaxed">{msg.content}</p>
                    : <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                }
            </div>
        </div>
    )
}

export default function AIAssistant() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)
    const chatRef = useRef(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [messages, loading])

    const sendMessage = async (text) => {
        const content = text || input.trim()
        if (!content || loading) return

        const newMessages = [...messages, { role: 'user', content }]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/assistant/chat', { messages: newMessages })
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I couldn\'t get a response. Please try again.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const clearChat = () => setMessages([])

    return (
        <Layout>
            <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">🤖 AI Study Assistant</h1>
                        <p className="text-indigo-300 text-sm mt-0.5">Ask anything — concepts, quizzes, summaries</p>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="text-xs text-indigo-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                        >
                            🗑 Clear
                        </button>
                    )}
                </div>

                {/* Chat area */}
                <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">

                    {/* Empty state */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
                            <div className="text-center">
                                <p className="text-5xl mb-3">🤖</p>
                                <p className="text-white font-semibold text-lg">How can I help you study today?</p>
                                <p className="text-indigo-300 text-sm mt-1">Ask me to explain, quiz, or summarise anything.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        className="text-left text-xs text-indigo-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <Message key={i} msg={msg} />
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1 items-center h-4">
                                    {[0, 1, 2].map(j => (
                                        <div
                                            key={j}
                                            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                                            style={{ animationDelay: `${j * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Ask anything about your studies..."
                        disabled={loading}
                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-indigo-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-4 py-3 rounded-xl transition-all"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </Layout>
    )
}