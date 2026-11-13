import { useState, useEffect } from 'react'

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

export default function Student({ onQueued }) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [village, setVillage] = useState('Malegaon Khurd')
  const [answers, setAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi('/api/lessons')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLessons(data)
      if (data.length > 0) {
        setSelectedLesson((prev) => prev || data[0])
      }
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
          if (data.length > 0) {
            setSelectedLesson((prev) => prev || data[0])
          }
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
      <div className="w-full py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 font-semibold text-base">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full my-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-red-200 text-center space-y-4">
        <p className="text-base text-red-600 font-medium">{error}</p>
        <button
          onClick={reload}
          className="min-h-[44px] px-6 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-base font-semibold transition cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Village selector card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Student Learning Center</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Read lessons and complete quick comprehension quizzes.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <label htmlFor="village-input" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Village:
          </label>
          <input
            id="village-input"
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="min-h-[44px] border border-gray-300 rounded-xl px-3.5 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50/30"
            placeholder="Enter village"
          />
        </div>
      </div>

      {/* Lesson Selector Pills */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Choose a Lesson:</p>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson)}
              className={`min-h-[44px] px-5 py-2.5 rounded-full text-base font-semibold transition-all whitespace-nowrap cursor-pointer shadow-xs active:scale-95 flex items-center justify-center ${
                selectedLesson?.id === lesson.id
                  ? 'bg-green-600 text-white shadow-sm border-2 border-green-600'
                  : 'bg-white text-green-900 hover:bg-green-100/70 border-2 border-green-200'
              }`}
            >
              {lesson.title}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Lesson Content */}
      {selectedLesson && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-green-100 space-y-5">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{selectedLesson.title}</h3>
            <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-normal">{selectedLesson.summary}</p>
            {selectedLesson.summary_hi && (
              <div className="bg-green-50 border-l-4 border-green-600 p-4 sm:p-5 rounded-r-xl space-y-1.5">
                <p className="text-xs sm:text-sm font-bold text-green-800 tracking-wide uppercase">हिंदी सारांश (Hindi Summary):</p>
                <p className="text-base sm:text-lg text-gray-900 leading-relaxed font-sans">{selectedLesson.summary_hi}</p>
              </div>
            )}
          </div>

          {/* Quiz Card */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-green-100 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <h4 className="text-xl font-bold text-gray-900">Quiz: {selectedLesson.title}</h4>
                {quizSubmitted && score !== null && (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-900 border border-green-300">
                    Score: {score} / {selectedLesson.quiz.length} ({Math.round((score / selectedLesson.quiz.length) * 100)}%)
                  </span>
                )}
              </div>

              {/* Quiz Questions */}
              <div className="space-y-6">
                {selectedLesson.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="p-5 bg-green-50/40 rounded-2xl space-y-3.5 border border-green-100/80">
                    <p className="font-bold text-gray-900 text-base sm:text-lg flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white font-bold text-sm shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <span>{q.q}</span>
                    </p>

                    {/* Full-width bordered option buttons, selected one highlighted */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = answers[qIdx] === oIdx
                        let btnStyle = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-green-400 hover:bg-green-50/50'

                        if (quizSubmitted) {
                          if (oIdx === q.answer) {
                            btnStyle = 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                          } else if (isSelected && oIdx !== q.answer) {
                            btnStyle = 'bg-red-50 border-2 border-red-500 text-red-950 font-medium'
                          } else {
                            btnStyle = 'bg-white border-2 border-gray-100 text-gray-500 opacity-70'
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-green-100/80 border-2 border-green-600 text-green-950 font-semibold shadow-xs ring-2 ring-green-600/20'
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleAnswer(qIdx, oIdx)}
                            disabled={quizSubmitted}
                            className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-left text-base transition-all cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                          >
                            <span className="flex-1">{opt}</span>
                            <span
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-green-600 bg-green-600 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length < selectedLesson.quiz.length || submitting}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-semibold text-base rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({})
                      setQuizSubmitted(false)
                      setScore(null)
                    }}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3 border-2 border-green-600 text-green-800 hover:bg-green-50 active:scale-95 font-semibold text-base rounded-xl transition cursor-pointer flex items-center justify-center"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
