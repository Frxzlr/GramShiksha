import { useState, useEffect } from 'react'
import {
  XCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { Segmented } from '../components/Segmented'

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

export default function Student({ onQueued, village: propVillage, syncStatus: _syncStatus = 'synced' }) {
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
      <div className="w-full space-y-4 text-left">
        <Skeleton className="h-10 w-48 rounded-[6px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Skeleton className="h-36 w-full rounded-[8px]" />
          <Skeleton className="h-36 w-full rounded-[8px]" />
          <Skeleton className="h-36 w-full rounded-[8px]" />
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
          <Button variant="secondary" onClick={reload}>
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
    <div className="w-full space-y-5 text-left">
      {/* Page Header Pattern */}
      {!selectedLesson ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
              Curriculum Modules
            </h2>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
              Offline-ready learning units and comprehension assessments for {village}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">
              {lessons.length} Modules
            </Badge>
            <Badge variant="emerald" size="sm" dot>
              {completedCount} Completed
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={handleBackToList}
            >
              All Modules
            </Button>
            <div className="min-w-0">
              <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-tight text-white dark:text-white text-zinc-900 truncate">
                {selectedLesson.title}
              </h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-400 text-zinc-500 font-mono">
                Module ID: {selectedLesson.id} · {selectedLesson.quiz?.length || 0} questions
              </p>
            </div>
          </div>
          <Segmented
            options={[
              { label: 'English', value: 'en' },
              { label: 'हिंदी', value: 'hi' },
              { label: 'Bilingual', value: 'bilingual' },
            ]}
            value={langTab}
            onChange={setLangTab}
          />
        </div>
      )}

      {/* Lesson List View */}
      {!selectedLesson ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {lessons.map((lesson, idx) => {
            const subjects = ['Science', 'Mathematics', 'Environmental', 'Physics']
            const subjectChip = subjects[idx % subjects.length]

            return (
              <div
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className="bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 rounded-[8px] p-4 flex flex-col justify-between hover:border-white/[0.16] dark:hover:border-white/[0.16] hover:border-zinc-300 transition-colors cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase">
                      MOD-{String(lesson.id).padStart(2, '0')}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {subjectChip}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white dark:text-white text-zinc-900 group-hover:text-[#22c55e] transition-colors leading-snug">
                      {lesson.title}
                    </h3>
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-400 text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                      {lesson.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.06] dark:border-white/[0.06] border-zinc-100 flex items-center justify-between text-[12px]">
                  <span className="font-mono text-zinc-400 tabular-nums">
                    {lesson.quiz ? `${lesson.quiz.length} questions` : 'Reading only'}
                  </span>
                  <span className="text-[#22c55e] font-medium text-[12px] flex items-center gap-1">
                    Start Module <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Selected Lesson View */
        <div className="space-y-5">
          {/* Reading Card */}
          <Card className="space-y-3.5">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Module Summary
            </div>

            {/* English Content */}
            {(langTab === 'en' || langTab === 'bilingual') && (
              <div className="space-y-1">
                {langTab === 'bilingual' && (
                  <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
                    English Text
                  </span>
                )}
                <p className="text-[14px] text-zinc-200 dark:text-zinc-200 text-zinc-800 leading-relaxed font-normal">
                  {selectedLesson.summary}
                </p>
              </div>
            )}

            {/* Hindi Content */}
            {(langTab === 'hi' || langTab === 'bilingual') && selectedLesson.summary_hi && (
              <div
                lang="hi"
                className="border-l-2 border-[#22c55e] bg-white/[0.02] dark:bg-white/[0.02] bg-zinc-50 pl-3.5 py-2.5 rounded-r-[6px] space-y-1"
              >
                <span className="text-[11px] uppercase tracking-wider text-[#22c55e] font-medium block">
                  हिंदी अनुवाद
                </span>
                <p className="text-[14px] text-zinc-200 dark:text-zinc-200 text-zinc-800 leading-relaxed font-devanagari">
                  {selectedLesson.summary_hi}
                </p>
              </div>
            )}
          </Card>

          {/* Quiz Section */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <Card className="space-y-4">
              {/* Quiz Header & Progress Bar */}
              <div className="space-y-2 pb-3 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white dark:text-white text-zinc-900">
                      Comprehension Assessment
                    </h3>
                    <p className="text-[12px] text-zinc-400">
                      Answer all questions to record score for {village}
                    </p>
                  </div>
                  {!quizSubmitted ? (
                    <span className="text-[12px] font-mono text-zinc-400 tabular-nums">
                      {answeredCount} / {totalQuestions} answered
                    </span>
                  ) : null}
                </div>

                {/* Thin Flat Progress Bar */}
                {!quizSubmitted && (
                  <div className="w-full h-1 bg-white/[0.08] dark:bg-white/[0.08] bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#22c55e] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Calm Score Summary (No emojis, no confetti) */}
              {quizSubmitted && score !== null && (
                <div className="p-3.5 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-white dark:text-white text-zinc-900">
                      {score === totalQuestions
                        ? 'Complete · All answers correct'
                        : `${score} of ${totalQuestions} questions correct`}
                    </div>
                    <div className="text-[12px] font-mono text-zinc-400 mt-0.5">
                      Score: {Math.round((score / totalQuestions) * 100)}% · Result queued for village record
                    </div>
                  </div>
                  <Badge
                    variant={score === totalQuestions ? 'emerald' : score >= totalQuestions / 2 ? 'neutral' : 'red'}
                    size="sm"
                  >
                    {score === totalQuestions ? 'Mastery' : 'Recorded'}
                  </Badge>
                </div>
              )}

              {/* Quiz Questions Step Cards */}
              <div className="space-y-3.5">
                {selectedLesson.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3.5 rounded-[6px] border border-white/[0.06] dark:border-white/[0.06] border-zinc-200 bg-white/[0.01] dark:bg-white/[0.01] bg-zinc-50/50 space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-zinc-400 mt-0.5">
                        Q{qIdx + 1}.
                      </span>
                      <p className="text-[14px] font-medium text-white dark:text-white text-zinc-900 leading-snug">
                        {q.q}
                      </p>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = answers[qIdx] === oIdx
                        let optionStyle =
                          'border-white/[0.08] dark:border-white/[0.08] border-zinc-200 hover:border-white/[0.16] hover:bg-white/[0.02] text-zinc-300 dark:text-zinc-300 text-zinc-700 bg-white/[0.02]'

                        if (quizSubmitted) {
                          if (oIdx === q.answer) {
                            optionStyle =
                              'bg-[#22c55e]/10 border-[#22c55e] text-[#22c55e] font-medium'
                          } else if (isSelected && oIdx !== q.answer) {
                            optionStyle =
                              'bg-red-500/10 border-red-500 text-red-400 font-medium'
                          } else {
                            optionStyle =
                              'opacity-40 border-white/[0.04] text-zinc-500'
                          }
                        } else if (isSelected) {
                          optionStyle =
                            'bg-[#22c55e]/10 border-[#22c55e] text-white font-medium'
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleAnswer(qIdx, oIdx)}
                            disabled={quizSubmitted}
                            className={`w-full min-h-[40px] px-3 py-2 rounded-[6px] text-left text-[13px] border transition-colors cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
                          >
                            <span className="flex-1">{opt}</span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-[#22c55e] bg-[#22c55e]'
                                  : 'border-zinc-600 bg-transparent'
                              }`}
                            >
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-black" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.08] dark:border-white/[0.08] border-zinc-200 flex flex-wrap items-center gap-2">
                {!quizSubmitted ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitQuiz}
                    disabled={answeredCount < totalQuestions || submitting}
                    loading={submitting}
                  >
                    Submit Assessment
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
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
                      variant="ghost"
                      size="md"
                      onClick={handleBackToList}
                    >
                      All Modules
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
