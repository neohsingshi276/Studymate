import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'

export default function WeeklyReport() {
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchReport = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/study-plan/weekly-report')
            setReport(res.data)
        } catch {
            setError('Failed to generate report. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="p-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">📋 Weekly Review Report</h1>
                        <p className="text-indigo-300 mt-1">AI-generated summary of your week.</p>
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                        {loading ? '⏳ Generating...' : '✨ Generate Report'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!report && !loading && !error && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-16 border border-white/10 text-center">
                        <p className="text-6xl mb-4">📊</p>
                        <p className="text-white font-semibold text-lg">No report yet</p>
                        <p className="text-indigo-400 text-sm mt-2">Click "Generate Report" to get your AI-powered weekly review.</p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 animate-pulse">
                                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                                <div className="h-3 bg-white/10 rounded w-4/5" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Report */}
                {report && !loading && (
                    <div className="space-y-4">

                        {/* Greeting + Summary */}
                        <div className="bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl p-6 border border-indigo-500/30">
                            <p className="text-white text-xl font-bold mb-2">{report.greeting}</p>
                            <p className="text-indigo-200 text-sm leading-relaxed">{report.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Strengths */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <span>💪</span> What You Did Well
                                </h2>
                                <ul className="space-y-2">
                                    {report.strengths?.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-200">
                                            <span className="text-green-400 mt-0.5">✓</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Improvements */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <span>🎯</span> Areas to Improve
                                </h2>
                                <ul className="space-y-2">
                                    {report.improvements?.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-200">
                                            <span className="text-yellow-400 mt-0.5">→</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Next Week Focus */}
                        <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <span>🚀</span> Focus for Next Week
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {report.nextWeekFocus?.map((focus, i) => (
                                    <div key={i} className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-200">
                                        <span className="text-indigo-400 font-bold mr-2">#{i + 1}</span>
                                        {focus}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Motivational message */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 text-center">
                            <p className="text-2xl mb-2">✨</p>
                            <p className="text-white font-medium italic">"{report.motivationalMessage}"</p>
                        </div>

                    </div>
                )}

            </div>
        </Layout>
    )
}
