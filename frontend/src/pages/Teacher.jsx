import { useState } from 'react'

const fetchApi = async (url, options) => {
  try {
    const res = await fetch(url, options)
    const ct = res.headers.get('content-type') || ''
    if (res.ok && (ct.includes('application/json') || options?.method === 'POST')) return res
  } catch {
    // fallback
  }
  return fetch(`http://localhost:4000${url}`, options)
}

export default function Teacher() {
  const [chapterText, setChapterText] = useState('')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [generatedLesson, setGeneratedLesson] = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (chapterText.trim().length < 40 || loading) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetchApi('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: chapterText }),
      })

      if (!res.ok) {
        throw new Error('Teachers need to be online to create lessons.')
      }

      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }

      setGeneratedLesson(data)
    } catch (err) {
      console.error('Lesson generation error:', err)
      setError('Teachers need to be online to create lessons.')
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (val) => {
    setGeneratedLesson((prev) => (prev ? { ...prev, title: val } : null))
  }

  const handleSummaryChange = (val) => {
    setGeneratedLesson((prev) => (prev ? { ...prev, summary: val } : null))
  }

  const handleSummaryHiChange = (val) => {
    setGeneratedLesson((prev) => (prev ? { ...prev, summary_hi: val } : null))
  }

  const handleQuestionChange = (qIndex, val) => {
    setGeneratedLesson((prev) => {
      if (!prev) return null
      const updatedQuiz = prev.quiz.map((q, idx) =>
        idx === qIndex ? { ...q, q: val } : q
      )
      return { ...prev, quiz: updatedQuiz }
    })
  }

  const handleOptionChange = (qIndex, optIndex, val) => {
    setGeneratedLesson((prev) => {
      if (!prev) return null
      const updatedQuiz = prev.quiz.map((q, idx) => {
        if (idx !== qIndex) return q
        const newOptions = [...q.options]
        newOptions[optIndex] = val
        return { ...q, options: newOptions }
      })
      return { ...prev, quiz: updatedQuiz }
    })
  }

  const handleAnswerChange = (qIndex, answerIndex) => {
    setGeneratedLesson((prev) => {
      if (!prev) return null
      const updatedQuiz = prev.quiz.map((q, idx) =>
        idx === qIndex ? { ...q, answer: answerIndex } : q
      )
      return { ...prev, quiz: updatedQuiz }
    })
  }

  const handlePublish = async () => {
    if (!generatedLesson || publishing) return

    setPublishing(true)
    setError(null)
    setSuccessMessage(null)

    const payload = {
      title: generatedLesson.title.trim(),
      summary: generatedLesson.summary.trim(),
      summary_hi: generatedLesson.summary_hi.trim(),
      quiz: generatedLesson.quiz.map((q) => ({
        q: q.q.trim(),
        options: q.options.map((opt) => opt.trim()),
        answer: q.answer,
      })),
    }

    try {
      const res = await fetchApi('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to publish lesson. Teachers need to be online.')
      }

      setSuccessMessage('Lesson published successfully! Students can now access it.')
      setGeneratedLesson(null)
      setChapterText('')
    } catch (err) {
      console.error('Publishing error:', err)
      setError('Teachers need to be online to create lessons.')
    } finally {
      setPublishing(false)
    }
  }

  const isTextTooShort = chapterText.trim().length < 40

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header & Input Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-green-100 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            AI Lesson Generator
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Paste textbook paragraphs or chapter notes to automatically generate a
            bilingual lesson and 5-question comprehension quiz tailored for classes 6–8.
          </p>
        </div>

        {/* Form to paste text */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label
              htmlFor="chapter-text"
              className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2"
            >
              Chapter / Textbook Content:
            </label>
            <textarea
              id="chapter-text"
              rows={8}
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
              placeholder="Paste textbook excerpt or chapter text here (at least 40 characters)..."
              className="w-full rounded-2xl border-2 border-gray-200 p-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400 leading-relaxed bg-green-50/20"
            />
            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 font-medium mt-1.5 px-1">
              <span>Minimum 40 characters</span>
              <span>{chapterText.trim().length} / 8000</span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isTextTooShort}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-semibold text-base rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                'Generate lesson + quiz'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-900 p-4 sm:p-5 rounded-2xl text-base font-medium flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-800 font-bold text-xl flex items-center justify-center"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border-2 border-green-300 text-green-950 p-4 sm:p-5 rounded-2xl text-base font-semibold flex items-center justify-between shadow-xs">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="min-h-[44px] min-w-[44px] text-green-700 hover:text-green-900 font-bold text-xl flex items-center justify-center"
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}

      {/* Editable Preview Card */}
      {generatedLesson && (
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-green-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Lesson Preview & Editor
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and refine the generated lesson before publishing to students.
              </p>
            </div>

            {/* Amber notice if demo/mocked */}
            {generatedLesson.mocked && (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 px-4 py-2 rounded-xl text-sm font-semibold self-start sm:self-auto flex items-center gap-2 shadow-xs">
                <span>⚠️</span>
                <span>Demo mode: no AI key found, showing a sample lesson.</span>
              </div>
            )}
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-title"
              className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider"
            >
              Lesson Title:
            </label>
            <input
              id="lesson-title"
              type="text"
              value={generatedLesson.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 px-4 py-2.5 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50/20"
            />
          </div>

          {/* English Summary */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-summary"
              className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider"
            >
              English Summary (4–5 sentences):
            </label>
            <textarea
              id="lesson-summary"
              rows={4}
              value={generatedLesson.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 p-4 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 leading-relaxed bg-green-50/20"
            />
          </div>

          {/* Hindi Summary */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-summary-hi"
              className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider"
            >
              हिंदी सारांश (Hindi Summary):
            </label>
            <textarea
              id="lesson-summary-hi"
              rows={4}
              value={generatedLesson.summary_hi}
              onChange={(e) => handleSummaryHiChange(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 p-4 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 leading-relaxed bg-green-50/20"
            />
          </div>

          {/* 5 Questions */}
          <div className="space-y-6 pt-3">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">
              Comprehension Quiz (5 Questions)
            </h4>

            {generatedLesson.quiz?.map((qItem, qIdx) => (
              <div
                key={qIdx}
                className="p-5 bg-green-50/30 rounded-2xl border border-green-200/80 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={qItem.q}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder={`Question ${qIdx + 1}`}
                    className="flex-1 min-h-[44px] rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 3 Options */}
                <div className="space-y-3 sm:pl-11">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">
                    Choose the correct answer with the radio button:
                  </p>
                  {qItem.options?.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        id={`q-${qIdx}-opt-${optIdx}`}
                        name={`correct-answer-${qIdx}`}
                        checked={qItem.answer === optIdx}
                        onChange={() => handleAnswerChange(qIdx, optIdx)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIdx, optIdx, e.target.value)
                        }
                        placeholder={`Option ${optIdx + 1}`}
                        className={`flex-1 min-h-[44px] rounded-xl border-2 px-4 py-2 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          qItem.answer === optIdx
                            ? 'border-green-600 bg-green-50/50 font-semibold ring-1 ring-green-600/30'
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Publish action bar */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setGeneratedLesson(null)}
              className="min-h-[44px] px-6 py-2.5 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-semibold rounded-xl transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 active:scale-95 text-white font-semibold text-base rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                'Publish to students'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
