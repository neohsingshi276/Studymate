import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const priorityColor = {
    low: 'bg-green-500/20 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30'
}

const statusColor = {
    pending: 'bg-gray-500/20 text-gray-300',
    'in-progress': 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300'
}

export default function Assignments() {
    const [assignments, setAssignments] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        title: '',
        subject: '',
        description: '',
        dueDate: '',
        priority: 'medium'
    })

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const res = await api.get('/assignments')
            setAssignments(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await api.post('/assignments', form)
            setAssignments([...assignments, res.data])
            setForm({ title: '', subject: '', description: '', dueDate: '', priority: 'medium' })
            setShowForm(false)
        } catch (err) {
            console.error(err)
        }
    }

    const handleStatusChange = async (id, status) => {
        try {
            const res = await api.put(`/assignments/${id}`, { status })
            setAssignments(assignments.map(a => a._id === id ? res.data : a))
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/assignments/${id}`)
            setAssignments(assignments.filter(a => a._id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const getDaysLeft = (dueDate) => {
        const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        if (diff < 0) return { text: 'Overdue!', color: 'text-red-400' }
        if (diff === 0) return { text: 'Due today!', color: 'text-orange-400' }
        if (diff === 1) return { text: '1 day left', color: 'text-yellow-400' }
        return { text: `${diff} days left`, color: 'text-indigo-300' }
    }

    const pending = assignments.filter(a => a.status === 'pending')
    const inProgress = assignments.filter(a => a.status === 'in-progress')
    const completed = assignments.filter(a => a.status === 'completed')

    return (
        <Layout>
            <div className="p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">📝 Assignments</h1>
                        <p className="text-indigo-300 mt-1">Track your tasks and deadlines</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ Add Assignment'}
                    </button>
                </div>

                {/* Add Form */}
                {showForm && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 mb-8">
                        <h2 className="text-white font-semibold mb-4">New Assignment</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-indigo-200 text-sm block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Assignment title"
                                    required
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="text-indigo-200 text-sm block mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    placeholder="e.g. Mathematics"
                                    required
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="text-indigo-200 text-sm block mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    required
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="text-indigo-200 text-sm block mb-1">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={e => setForm({ ...form, priority: e.target.value })}
                                    className="w-full bg-indigo-950 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-indigo-200 text-sm block mb-1">Description (optional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Additional details..."
                                    rows={2}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 resize-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Add Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
                        <p className="text-2xl font-bold text-white">{pending.length}</p>
                        <p className="text-indigo-300 text-sm">Pending</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
                        <p className="text-2xl font-bold text-white">{inProgress.length}</p>
                        <p className="text-indigo-300 text-sm">In Progress</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
                        <p className="text-2xl font-bold text-white">{completed.length}</p>
                        <p className="text-indigo-300 text-sm">Completed</p>
                    </div>
                </div>

                {/* Assignment List */}
                {loading ? (
                    <p className="text-indigo-300 text-center py-12">Loading assignments...</p>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">📝</p>
                        <p className="text-white font-semibold text-lg">No assignments yet</p>
                        <p className="text-indigo-400 text-sm mt-1">Click "Add Assignment" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map(assignment => {
                            const daysLeft = getDaysLeft(assignment.dueDate)
                            return (
                                <div
                                    key={assignment._id}
                                    className={`bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10 ${assignment.status === 'completed' ? 'opacity-60' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className={`text-white font-medium ${assignment.status === 'completed' ? 'line-through' : ''}`}>
                                                    {assignment.title}
                                                </h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[assignment.priority]}`}>
                                                    {assignment.priority}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[assignment.status]}`}>
                                                    {assignment.status}
                                                </span>
                                            </div>
                                            <p className="text-indigo-400 text-sm">{assignment.subject}</p>
                                            {assignment.description && (
                                                <p className="text-indigo-300 text-sm mt-1">{assignment.description}</p>
                                            )}
                                            <p className={`text-xs mt-2 font-medium ${daysLeft.color}`}>
                                                📅 {new Date(assignment.dueDate).toLocaleDateString()} — {daysLeft.text}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            <select
                                                value={assignment.status}
                                                onChange={e => handleStatusChange(assignment._id, e.target.value)}
                                                className="bg-indigo-950 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="completed">Completed ✅</option>
                                            </select>
                                            <button
                                                onClick={() => handleDelete(assignment._id)}
                                                className="text-red-400 hover:text-red-300 text-xs transition-colors"
                                            >
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                    {assignment.status === 'completed' && (
                                        <div className="mt-3 bg-green-500/10 rounded-lg p-2 text-center">
                                            <p className="text-green-300 text-xs">✅ Completed! You earned +50 XP and 10 coins 🪙</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}