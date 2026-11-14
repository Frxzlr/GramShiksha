import { useState, useEffect } from 'react'
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Languages,
  Clock,
  MapPin,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

const fetchApi = async (url, options) => {
  try {
    const res = await fetch(url, options)
    const ct = res.headers.get('content-type') || ''
    if (res.ok && ct.includes('application/json')) return res
  } catch {
    // Ignore and fallback
  }
  return fetch(`http://localhost:4000${url}`, options)
}

export default function Student({ onQueued, village: propVillage, syncStatus = 'synced' }) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const village = (() => {
    try {
      return propVillage || localStorage.getItem('gs_village') || 'Malegaon Khurd'
    } catch {
      return propVillage || 'Malegaon Khurd'
    }
  })()
  const [answers, setAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [langTab, setLangTab] = useState('bilingual') // 'en' | 'hi' | 'bilingual'
  const [completedCount, setCompletedCount] = useState(() => {
    try {
      return Number(localStorage.getItem('gs_student_quizzes_completed') || 0)
    } catch {
      return 0
    }
  })

  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi('/api/lessons')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLessons(data)
    } catch (err) {
      console.error('Failed to load lessons:', err)
      setError(err.message || 'Unable to load lessons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    const init = async () => {
      try {
        const res = await fetchApi('/api/lessons')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!ignore) {
          setLessons(data)
          setLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to load lessons')
          setLoading(false)
        }
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [])

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson)
    setAnswers({})
    setQuizSubmitted(false)
    setScore(null)
  }

  const handleBackToList = () => {
    setSelectedLesson(null)
    setAnswers({})
    setQuizSubmitted(false)
    setScore(null)
  }

  const handleAnswer = (questionIndex, optionIndex) => {
    if (quizSubmitted) return
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const handleSubmitQuiz = async () => {
    if (!selectedLesson || !selectedLesson.quiz) return
    let correct = 0
    selectedLesson.quiz.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct += 1
    })

    setScore(correct)
    setQuizSubmitted(true)
    setSubmitting(true)

    // Increment local quiz completion count
    const nextCompleted = completedCount + 1
    setCompletedCount(nextCompleted)
    try {
      localStorage.setItem('gs_student_quizzes_completed', String(nextCompleted))
    } catch {}

    const result = {
      lessonId: selectedLesson.id,
      lessonTitle: selectedLesson.title,
      village: village || 'Unknown Village',
      score: correct,
      total: selectedLesson.quiz.length,
      at: Date.now(),
    }

    try {
      await fetchApi('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (onQueued) onQueued()
    } catch (err) {
      console.warn('Network request failed, queueing offline result:', err)
      if (onQueued) onQueued()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 text-left">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to Load Lessons"
        description={error}
        action={
          <Button variant="primary" onClick={reload}>
            Retry Connection
          </Button>
        }
      />
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = selectedLesson?.quiz?.length || 0
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <div className="w-full space-y-6 text-left">
      {/* Compact Hero Banner */}
      <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="emerald" size="sm" dot>
                Offline-Ready Classroom
              </Badge>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {village}
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
              Welcome to Your Learning Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Cached bilingual modules ready for independent study. Solve interactive quizzes anytime, even with zero network coverage.
            </p>
          </div>

          {/* 3 Mini-Stats using data already in state/props */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100/80 p-2.5 sm:p-3 rounded-xl border border-white/[0.06] dark:border-white/[0.06] border-slate-200 shrink-0">
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Available
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold dark:text-white text-slate-900 tabular-nums">
                {lessons.length}
              </span>
            </div>

            <div className="px-3 py-1.5 text-center border-x border-white/[0.06] dark:border-white/[0.06] border-slate-200">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">
                {completedCount}
              </span>
            </div>

            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sync State
              </span>
              <span className="font-heading text-xs sm:text-sm font-semibold text-cyan-400 mt-1 block">
                {syncStatus === 'syncing' ? 'Syncing...' : 'Up to date'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson List View (when no lesson is selected) */}
      {!selectedLesson ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight dark:text-white text-slate-900">
                Explore Curriculum Modules
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Select a lesson to begin reading and take the comprehension test.
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              {lessons.length} Modules
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson, idx) => {
              const subjects = ['Science', 'Mathematics', 'Environmental', 'Physics']
              const subjectChip = subjects[idx % subjects.length]

              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="glass-card rounded-2xl p-5 flex flex-col justify-between group cursor-pointer hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral" size="sm">
                        {subjectChip}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-heading text-base font-bold dark:text-white text-slate-900 group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lesson.quiz ? `${lesson.quiz.length} Questions` : 'Lesson'}
                    </span>
                    <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Start Lesson <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Selected Lesson View */
        <div className="space-y-6">
          {/* Back Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={handleBackToList}
            >
              Back to all lessons
            </Button>

            {/* Language view toggle */}
            <div className="flex items-center gap-1 bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 p-1 rounded-xl border border-white/10 dark:border-white/10 border-slate-200">
              <button
                type="button"
                onClick={() => setLangTab('bilingual')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  langTab === 'bilingual'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bilingual
              </button>
              <button
                type="button"
                onClick={() => setLangTab('en')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  langTab === 'en'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLangTab('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  langTab === 'hi'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Reading Card */}
          <Card className="space-y-5">
            <div className="space-y-1">
              <Badge variant="cyan" size="sm" className="mb-2">
                Chapter Overview
              </Badge>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
                {selectedLesson.title}
              </h3>
            </div>

            {/* English Content */}
            {(langTab === 'en' || langTab === 'bilingual') && (
              <div className="space-y-2">
                {langTab === 'bilingual' && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    English Summary
                  </span>
                )}
                <p className="text-base sm:text-lg dark:text-slate-200 text-slate-700 leading-relaxed font-normal">
                  {selectedLesson.summary}
                </p>
              </div>
            )}

            {/* Hindi Content */}
            {(langTab === 'hi' || langTab === 'bilingual') && selectedLesson.summary_hi && (
              <div
                lang="hi"
                className="bg-emerald-500/[0.06] dark:bg-emerald-500/[0.06] bg-emerald-50/70 border-l-4 border-emerald-500 p-4 sm:p-5 rounded-r-xl space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 dark:text-emerald-400 text-emerald-700 tracking-wide uppercase">
                    हिंदी सारांश (Hindi Summary):
                  </span>
                </div>
                <p className="text-base sm:text-lg dark:text-slate-100 text-slate-800 leading-relaxed font-devanagari">
                  {selectedLesson.summary_hi}
                </p>
              </div>
            )}
          </Card>

          {/* Quiz Section */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <Card className="space-y-6">
              {/* Quiz Header & Progress Bar */}
              <div className="space-y-3 pb-4 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-lg sm:text-xl font-bold dark:text-white text-slate-900">
                      Comprehension Assessment
                    </h4>
                    <p className="text-xs text-slate-400">
                      Answer all questions to submit your score to the village record.
                    </p>
                  </div>

                  {!quizSubmitted ? (
                    <Badge variant="cyan" size="sm">
                      {answeredCount} of {totalQuestions} answered
                    </Badge>
                  ) : null}
                </div>

                {/* Progress bar */}
                {!quizSubmitted && (
                  <div className="w-full h-1.5 bg-white/[0.06] dark:bg-white/[0.06] bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Polished Result Screen with SVG Score Ring when Submitted */}
              {quizSubmitted && score !== null && (
                <div className="py-6 px-4 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20 text-center flex flex-col items-center justify-center space-y-4">
                  {/* SVG Score Ring */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-700/40"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-emerald-400 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * score) / totalQuestions}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-heading text-2xl font-black text-white dark:text-white text-slate-900 tabular-nums">
                        {Math.round((score / totalQuestions) * 100)}%
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {score}/{totalQuestions}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-heading text-xl font-bold dark:text-white text-slate-900">
                      {score === totalQuestions
                        ? 'Mastery Achieved! 🌟'
                        : score >= totalQuestions / 2
                        ? 'Well Done! 👍'
                        : 'Keep Practicing! 📚'}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Your result has been stored offline and will auto-sync when connected.
                    </p>
                  </div>
                </div>
              )}

              {/* Quiz Questions Step Cards */}
              <div className="space-y-6">
                {selectedLesson.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl border border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 bg-white/[0.02] dark:bg-white/[0.02] bg-slate-50/50 space-y-4"
                  >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <p className="font-heading text-base sm:text-lg font-bold dark:text-white text-slate-900 leading-snug">
                          {q.q}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = answers[qIdx] === oIdx
                          let optionStyle =
                            'border-white/[0.08] dark:border-white/[0.08] border-slate-200 hover:border-emerald-500/40 hover:bg-white/[0.03] text-slate-300 dark:text-slate-300 text-slate-700 bg-white/[0.02]'

                          if (quizSubmitted) {
                            if (oIdx === q.answer) {
                              optionStyle =
                                'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-xs ring-1 ring-emerald-500/40'
                            } else if (isSelected && oIdx !== q.answer) {
                              optionStyle =
                                'bg-rose-500/20 border-rose-500 text-rose-300 font-medium'
                            } else {
                              optionStyle =
                                'opacity-40 border-white/[0.04] text-slate-500'
                            }
                          } else if (isSelected) {
                            optionStyle =
                              'bg-emerald-500/15 border-emerald-500/70 text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleAnswer(qIdx, oIdx)}
                              disabled={quizSubmitted}
                              className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-left text-sm sm:text-base border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
                            >
                              <span className="flex-1">{opt}</span>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'border-emerald-400 bg-emerald-500 text-white'
                                    : 'border-slate-500 bg-transparent'
                                }`}
                              >
                                {quizSubmitted && oIdx === q.answer ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : quizSubmitted && isSelected && oIdx !== q.answer ? (
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                ) : isSelected ? (
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                ) : null}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-200 flex flex-wrap items-center gap-3">
                {!quizSubmitted ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmitQuiz}
                    disabled={answeredCount < totalQuestions || submitting}
                    loading={submitting}
                    className="w-full sm:w-auto"
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="md"
                      icon={RotateCcw}
                      onClick={() => {
                        setAnswers({})
                        setQuizSubmitted(false)
                        setScore(null)
                      }}
                    >
                      Retake Quiz
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleBackToList}
                    >
                      Choose Another Lesson
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
