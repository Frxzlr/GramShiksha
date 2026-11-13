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
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium text-sm">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-xl shadow border border-red-100 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={reload}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-left">
      {/* Village selector */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Student Learning Center</h2>
          <p className="text-xs text-gray-500">Read lessons and complete quick comprehension quizzes.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="village-input" className="text-xs font-semibold text-gray-600 uppercase">
            Village:
          </label>
          <input
            id="village-input"
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter village"
          />
        </div>
      </div>

      {/* Lesson Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => handleSelectLesson(lesson)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              selectedLesson?.id === lesson.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {lesson.title}
          </button>
        ))}
      </div>

      {/* Selected Lesson Content */}
      {selectedLesson && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{selectedLesson.title}</h3>
            <p className="text-gray-700 leading-relaxed">{selectedLesson.summary}</p>
            {selectedLesson.summary_hi && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-xs font-bold text-green-800 mb-1">हिंदी सारांश (Hindi Summary):</p>
                <p className="text-gray-800 leading-relaxed font-sans">{selectedLesson.summary_hi}</p>
              </div>
            )}
          </div>

          {/* Quiz */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-900">Quiz: {selectedLesson.title}</h4>
                {quizSubmitted && score !== null && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    Score: {score} / {selectedLesson.quiz.length} ({Math.round((score / selectedLesson.quiz.length) * 100)}%)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {selectedLesson.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                    <p className="font-medium text-gray-800 text-sm">
                      {qIdx + 1}. {q.q}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = answers[qIdx] === oIdx
                        let btnStyle = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        if (quizSubmitted) {
                          if (oIdx === q.answer) {
                            btnStyle = 'bg-green-100 border-green-500 text-green-900 font-bold'
                          } else if (isSelected && oIdx !== q.answer) {
                            btnStyle = 'bg-red-100 border-red-400 text-red-900'
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-green-600 border-green-600 text-white'
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleAnswer(qIdx, oIdx)}
                            disabled={quizSubmitted}
                            className={`px-3 py-2 text-xs rounded-lg border text-left transition ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length < selectedLesson.quiz.length || submitting}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
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
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm rounded-lg transition"
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
