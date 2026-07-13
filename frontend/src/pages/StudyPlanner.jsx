import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

const priorityColor = {
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
    low: 'bg-green-500/20 text-green-300'
}

export default function StudyPlanner() {
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [weeklyReport, setWeeklyReport] = useState(null)
    const [loadingReport, setLoadingReport] = useState(false)
    const [form, setForm] = useState({
        examDate: '',
        hoursPerDay: 3,
        subjects: [{ name: '', difficulty: 'medium' }]
    })

    useEffect(() => {
        fetchLatestPlan()
    }, [])

    const fetchLatestPlan = async () => {
        try {
            const res = await api.get('/study-plan/latest')
            setPlan(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const addSubject = () => {
        setForm({
            ...form,
            subjects: [...form.subjects, { name: '', difficulty: 'medium' }]
        })
    }

    const removeSubject = (index) => {
        setForm({
            ...form,
            subjects: form.subjects.filter((_, i) => i !== index)
        })
    }

    const updateSubject = (index, field, value) => {
        const updated = [...form.subjects]
        updated[index][field] = value
        setForm({ ...form, subjects: updated })
    }

    const handleGenerate = async (e) => {
        e.preventDefault()
        setGenerating(true)
        try {
            const res = await api.post('/study-plan/generate', form)
            setPlan(res.data.studyPlan)
            setShowForm(false)
        } catch (err) {
            console.error(err)
            alert('Failed to generate plan. Check your Gemini API key.')
        } finally {
            setGenerating(false)
        }
    }

    const completeSession = async (dayIndex, sessionIndex) => {
        try {
            await api.put('/study-plan/complete-session', {
                planId: plan._id,
                dayIndex,
                sessionIndex
            })
            const updated = { ...plan }
            updated.plan[dayIndex].sessions[sessionIndex].completed = true
            setPlan(updated)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchWeeklyReport = async () => {
        setLoadingReport(true)
        try {
            const res = await api.get('/study-plan/weekly-report')
            setWeeklyReport(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingReport(false)
        }
    }

    return (
        <Layout>
            <div className="p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">📅 AI Study Planner</h1>
                        <p className="text-indigo-300 mt-1">Let AI generate your personalised study timetable</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchWeeklyReport}
                            disabled={loadingReport}
                            className="bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 border border-purple-500/30 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            {loadingReport ? '⏳ Loading...' : '📊 Weekly Report'}
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            {showForm ? 'Cancel' : '✨ Generate New Plan'}
                        </button>
                    </div>
                </div>

                {/* Generate Form */}
                {showForm && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 mb-8">
                        <h2 className="text-white font-semibold mb-4">Generate Study Plan</h2>
                        <form onSubmit={handleGenerate} className="space-y-4">

                            {/* Subjects */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-indigo-200 text-sm">Subjects</label>
                                    <button
                                        type="button"
                                        onClick={addSubject}
                                        className="text-indigo-400 hover:text-indigo-300 text-xs"
                                    >
                                        + Add Subject
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.subjects.map((subject, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={subject.name}
                                                onChange={e => updateSubject(index, 'name', e.target.value)}
                                                placeholder="Subject name"
                                                required
                                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400"
                                            />
                                            <select
                                                value={subject.difficulty}
                                                onChange={e => updateSubject(index, 'difficulty', e.target.value)}
                                                className="bg-indigo-950 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                            {form.subjects.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubject(index)}
                                                    className="text-red-400 hover:text-red-300 px-2"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-indigo-200 text-sm block mb-1">Exam Date</label>
                                    <input
                                        type="date"
                                        value={form.examDate}
                                        onChange={e => setForm({ ...form, examDate: e.target.value })}
                                        required
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-indigo-200 text-sm block mb-1">Hours per day</label>
                                    <input
                                        type="number"
                                        value={form.hoursPerDay}
                                        onChange={e => setForm({ ...form, hoursPerDay: Number(e.target.value) })}
                                        min={1}
                                        max={12}
                                        required
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                {generating ? '🤖 AI is generating your plan...' : '✨ Generate Plan'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Weekly Report */}
                {weeklyReport && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur rounded-xl p-6 border border-purple-500/30 mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-white font-bold text-lg">📊 Your Weekly Report</h2>
                            <button onClick={() => setWeeklyReport(null)} className="text-indigo-400 hover:text-white">✕</button>
                        </div>
                        <p className="text-purple-200 font-medium mb-2">{weeklyReport.greeting}</p>
                        <p className="text-indigo-300 text-sm mb-4">{weeklyReport.summary}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-green-300 text-xs font-semibold mb-2">💪 Strengths</p>
                                {weeklyReport.strengths?.map((s, i) => (
                                    <p key={i} className="text-green-200 text-xs mb-1">• {s}</p>
                                ))}
                            </div>
                            <div>
                                <p className="text-yellow-300 text-xs font-semibold mb-2">📈 Improve On</p>
                                {weeklyReport.improvements?.map((s, i) => (
                                    <p key={i} className="text-yellow-200 text-xs mb-1">• {s}</p>
                                ))}
                            </div>
                            <div>
                                <p className="text-indigo-300 text-xs font-semibold mb-2">🎯 Next Week Focus</p>
                                {weeklyReport.nextWeekFocus?.map((s, i) => (
                                    <p key={i} className="text-indigo-200 text-xs mb-1">• {s}</p>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 bg-indigo-500/20 rounded-lg p-3">
                            <p className="text-indigo-200 text-sm italic">💬 {weeklyReport.motivationalMessage}</p>
                        </div>
                    </div>
                )}

                {/* Study Plan */}
                {loading ? (
                    <p className="text-indigo-300 text-center py-12">Loading your plan...</p>
                ) : !plan ? (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">🤖</p>
                        <p className="text-white font-bold text-xl">No study plan yet</p>
                        <p className="text-indigo-400 mt-2">Click "Generate New Plan" to let AI create your personalised timetable</p>
                    </div>
                ) : (
                    <div>
                        <div className="bg-white/10 rounded-xl p-4 border border-white/10 mb-6">
                            <p className="text-indigo-200 text-sm">📋 <span className="text-white font-medium">AI Strategy:</span> {plan.summary}</p>
                        </div>
                        <div className="space-y-4">
                            {plan.plan?.map((day, dayIndex) => (
                                <div key={dayIndex} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-white font-semibold">{day.day}</h3>
                                            <p className="text-indigo-400 text-xs">{day.date}</p>
                                        </div>
                                        <span className="text-indigo-300 text-xs bg-indigo-500/20 px-3 py-1 rounded-full">
                                            {day.sessions?.length} sessions
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-3">
                                        {day.sessions?.map((session, sessionIndex) => (
                                            <div
                                                key={sessionIndex}
                                                className={`flex items-center gap-3 p-3 rounded-lg border ${session.completed
                                                        ? 'bg-green-500/10 border-green-500/20 opacity-60'
                                                        : 'bg-white/5 border-white/10'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => !session.completed && completeSession(dayIndex, sessionIndex)}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${session.completed
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-indigo-400 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {session.completed && <span className="text-white text-xs">✓</span>}
                                                </button>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${session.completed ? 'line-through text-indigo-400' : 'text-white'}`}>
                                                        {session.subject}
                                                    </p>
                                                    <p className="text-indigo-400 text-xs">{session.topic}</p>
                                                </div>
                                                <span className="text-indigo-300 text-xs">{session.duration}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[session.priority] || priorityColor.medium}`}>
                                                    {session.priority}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {day.tip && (
                                        <div className="bg-indigo-500/10 rounded-lg p-2">
                                            <p className="text-indigo-300 text-xs">💡 {day.tip}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}