import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const TABS = [
    { key: 'browse', label: 'Browse' },
    { key: 'mine', label: 'My Notes' },
    { key: 'bookmarked', label: 'Bookmarked' },
    { key: 'leaderboard', label: 'Top Creators' }
]

export default function NotesMarketplace() {
    const { user } = useAuth()
    const [tab, setTab] = useState('browse')
    const [notes, setNotes] = useState([])
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('')
    const [sort, setSort] = useState('recent')

    const [showUpload, setShowUpload] = useState(false)
    const [form, setForm] = useState({ title: '', subject: '', content: '', tags: '', file: null })
    const [selectedNote, setSelectedNote] = useState(null)
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, sort])

    const loadData = async () => {
        setLoading(true)
        try {
            if (tab === 'browse') {
                const res = await api.get('/notes', { params: { search, subject: subjectFilter, sort } })
                setNotes(res.data)
            } else if (tab === 'mine') {
                const res = await api.get('/notes/mine')
                setNotes(res.data)
            } else if (tab === 'bookmarked') {
                const res = await api.get('/notes/bookmarked')
                setNotes(res.data)
            } else if (tab === 'leaderboard') {
                const res = await api.get('/notes/top-creators')
                setLeaderboard(res.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        loadData()
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!form.content && !form.file) {
            alert('Add note content or attach a file')
            return
        }
        try {
            const fd = new FormData()
            fd.append('title', form.title)
            fd.append('subject', form.subject)
            fd.append('content', form.content)
            fd.append('tags', form.tags)
            if (form.file) fd.append('file', form.file)

            await api.post('/notes', fd) // axios sets multipart boundary automatically for FormData
            setShowUpload(false)
            setForm({ title: '', subject: '', content: '', tags: '', file: null })
            setTab('mine')
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload note')
        }
    }

    const downloadFile = async (note) => {
        setDownloadingId(note._id)
        try {
            const res = await api.get(`/notes/${note._id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', note.fileName || 'note-file')
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            alert('Failed to download file')
        } finally {
            setDownloadingId(null)
        }
    }

    const fileIcon = (fileType) => {
        if (!fileType) return '📎'
        if (fileType === 'application/pdf') return '📄'
        if (fileType.startsWith('image/')) return '🖼️'
        if (fileType.includes('word')) return '📝'
        return '📎'
    }

    const formatSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const toggleBookmark = async (noteId) => {
        try {
            const res = await api.post(`/notes/${noteId}/bookmark`)
            setNotes(prev => prev.map(n => {
                if (n._id !== noteId) return n
                const bookmarkedBy = res.data.bookmarked
                    ? [...(n.bookmarkedBy || []), user._id]
                    : (n.bookmarkedBy || []).filter(id => id !== user._id)
                return { ...n, bookmarkedBy, bookmarkCount: res.data.bookmarkCount }
            }))
        } catch (err) {
            console.error(err)
        }
    }

    const deleteNote = async (noteId) => {
        if (!confirm('Delete this note?')) return
        try {
            await api.delete(`/notes/${noteId}`)
            setNotes(prev => prev.filter(n => n._id !== noteId))
        } catch (err) {
            console.error(err)
        }
    }

    const openNote = async (note) => {
        try {
            const res = await api.get(`/notes/${note._id}`)
            setSelectedNote(res.data)

            if (res.data.fileType?.startsWith('image/')) {
                const imgRes = await api.get(`/notes/${note._id}/download`, { responseType: 'blob' })
                setImagePreviewUrl(window.URL.createObjectURL(new Blob([imgRes.data])))
            }
        } catch (err) {
            console.error(err)
        }
    }

    const closeNote = () => {
        if (imagePreviewUrl) window.URL.revokeObjectURL(imagePreviewUrl)
        setImagePreviewUrl(null)
        setSelectedNote(null)
    }

    const isBookmarked = (note) => (note.bookmarkedBy || []).some(id => id === user._id || id?._id === user._id)

    return (
        <Layout>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">📚 Notes Marketplace</h1>
                        <p className="text-indigo-300">Share your notes, bookmark others', earn bonus XP when people bookmark yours.</p>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
                    >
                        + Upload Notes
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t.key
                                ? 'border-indigo-400 text-white'
                                : 'border-transparent text-indigo-300 hover:text-white'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Search bar (browse only) */}
                {tab === 'browse' && (
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by title or tag..."
                            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400"
                        />
                        <input
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            placeholder="Subject filter..."
                            className="w-48 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400"
                        />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-indigo-950 border border-white/10 rounded-lg px-4 py-2.5 text-white"
                        >
                            <option value="recent">Newest</option>
                            <option value="popular">Most Bookmarked</option>
                        </select>
                        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg">Search</button>
                    </form>
                )}

                {loading && <p className="text-indigo-300">Loading...</p>}

                {/* Note grid (browse / mine / bookmarked) */}
                {!loading && tab !== 'leaderboard' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.length === 0 && (
                            <p className="text-indigo-400 col-span-full text-center py-12">No notes here yet.</p>
                        )}
                        {notes.map(note => (
                            <div key={note._id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">{note.subject}</span>
                                    <span className="text-indigo-400 text-xs">👁 {note.views || 0}</span>
                                </div>
                                <h3 className="text-white font-semibold mb-1 line-clamp-1">{note.title}</h3>
                                {note.content ? (
                                    <p className="text-indigo-300 text-sm mb-3 line-clamp-2">{note.content}</p>
                                ) : (
                                    <p className="text-indigo-400 text-sm mb-3 italic">No written notes — file attachment only</p>
                                )}
                                {note.fileName && (
                                    <div className="flex items-center gap-2 mb-3 bg-white/5 rounded-lg px-3 py-2">
                                        <span className="text-lg">{fileIcon(note.fileType)}</span>
                                        <div className="min-w-0">
                                            <p className="text-white text-xs truncate">{note.fileName}</p>
                                            <p className="text-indigo-400 text-[11px]">{formatSize(note.fileSize)} · {note.downloadCount || 0} downloads</p>
                                        </div>
                                    </div>
                                )}
                                {note.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {note.tags.map(tag => (
                                            <span key={tag} className="text-xs text-indigo-400 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/10">
                                    <span className="text-xs text-indigo-400">by {note.author?.name || 'Unknown'}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleBookmark(note._id)}
                                            className={`text-xs px-2.5 py-1 rounded-full transition-all ${isBookmarked(note) ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-indigo-300 hover:bg-white/10'}`}
                                        >
                                            🔖 {note.bookmarkCount ?? note.bookmarkedBy?.length ?? 0}
                                        </button>
                                        <button onClick={() => openNote(note)} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-indigo-300 hover:bg-white/10">
                                            Read
                                        </button>
                                        {note.fileName && (
                                            <button
                                                onClick={() => downloadFile(note)}
                                                disabled={downloadingId === note._id}
                                                className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                                            >
                                                {downloadingId === note._id ? '...' : '⬇ Download'}
                                            </button>
                                        )}
                                        {tab === 'mine' && (
                                            <button onClick={() => deleteNote(note._id)} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Leaderboard */}
                {!loading && tab === 'leaderboard' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
                        {leaderboard.length === 0 && <p className="text-indigo-400 text-center py-12">No creators yet — be the first!</p>}
                        {leaderboard.map((creator, i) => (
                            <div key={creator.userId} className="flex items-center gap-4 p-4">
                                <span className="text-xl w-8 text-center">{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                    {creator.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{creator.name}</p>
                                    <p className="text-indigo-400 text-xs">{creator.noteCount} notes shared</p>
                                </div>
                                <span className="text-yellow-300 font-bold">🔖 {creator.totalBookmarks}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload modal */}
                {showUpload && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                        <div className="bg-indigo-950 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-white mb-4">Upload Notes</h2>
                            <form onSubmit={handleUpload} className="space-y-3">
                                <input
                                    required
                                    placeholder="Title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400"
                                />
                                <input
                                    required
                                    placeholder="Subject (e.g. Math)"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400"
                                />
                                <textarea
                                    rows={8}
                                    placeholder="Write your notes here (optional if you're attaching a file)..."
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 resize-none"
                                />
                                <div>
                                    <label className="text-indigo-300 text-xs mb-1 block">Attach a file (PDF, image, or Word doc — optional, max 15MB)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
                                        onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                                        className="w-full text-indigo-300 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-500 file:text-white file:cursor-pointer file:hover:bg-indigo-600"
                                    />
                                    {form.file && (
                                        <p className="text-indigo-400 text-xs mt-1">{form.file.name} ({formatSize(form.file.size)})</p>
                                    )}
                                </div>
                                <input
                                    placeholder="Tags, comma separated (e.g. algebra, exam-tips)"
                                    value={form.tags}
                                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400"
                                />
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowUpload(false)} className="flex-1 bg-white/5 text-indigo-300 py-2.5 rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2.5 rounded-lg">Publish (+10 XP)</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Note detail viewer */}
                {selectedNote && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={closeNote}>
                        <div className="bg-indigo-950 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">{selectedNote.subject}</span>
                                    <h2 className="text-2xl font-bold text-white mt-2">{selectedNote.title}</h2>
                                    <p className="text-indigo-400 text-xs mt-1">by {selectedNote.author?.name} · 👁 {selectedNote.views} views</p>
                                </div>
                                <button onClick={closeNote} className="text-indigo-300 hover:text-white text-xl">✕</button>
                            </div>

                            {imagePreviewUrl && (
                                <img src={imagePreviewUrl} alt={selectedNote.fileName} className="w-full rounded-lg mb-4 border border-white/10" />
                            )}

                            {selectedNote.content && (
                                <p className="text-indigo-100 whitespace-pre-wrap leading-relaxed mb-4">{selectedNote.content}</p>
                            )}

                            {selectedNote.fileName && (
                                <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{fileIcon(selectedNote.fileType)}</span>
                                        <div>
                                            <p className="text-white text-sm">{selectedNote.fileName}</p>
                                            <p className="text-indigo-400 text-xs">{formatSize(selectedNote.fileSize)} · {selectedNote.downloadCount || 0} downloads</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadFile(selectedNote)}
                                        disabled={downloadingId === selectedNote._id}
                                        className="bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
                                    >
                                        {downloadingId === selectedNote._id ? 'Downloading...' : '⬇ Download'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}