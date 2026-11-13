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
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-left">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          AI Lesson Generator
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Paste textbook paragraphs or chapter notes to automatically generate a
          bilingual lesson and 5-question comprehension quiz tailored for classes 6–8.
        </p>

        {/* Form to paste text */}
        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="chapter-text"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Chapter / Textbook Content
            </label>
            <textarea
              id="chapter-text"
              rows={8}
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
              placeholder="Paste textbook excerpt or chapter text here (at least 40 characters)..."
              className="w-full rounded-xl border border-gray-300 p-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder:text-gray-400"
            />
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>Minimum 40 characters</span>
              <span>{chapterText.trim().length} / 8000</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || isTextTooShort}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Editable Preview */}
      {generatedLesson && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Lesson Preview & Editor
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and refine the lesson content before publishing it to rural classrooms.
              </p>
            </div>

            {/* Amber notice if demo/mocked */}
            {generatedLesson.mocked && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium self-start sm:self-auto flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Demo mode: no AI key found, showing a sample lesson.</span>
              </div>
            )}
          </div>

          {/* Title input */}
          <div>
            <label
              htmlFor="lesson-title"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
            >
              Lesson Title
            </label>
            <input
              id="lesson-title"
              type="text"
              value={generatedLesson.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* English Summary */}
          <div>
            <label
              htmlFor="lesson-summary"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
            >
              English Summary (Simple 4-5 sentences)
            </label>
            <textarea
              id="lesson-summary"
              rows={4}
              value={generatedLesson.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 leading-relaxed"
            />
          </div>

          {/* Hindi Summary */}
          <div>
            <label
              htmlFor="lesson-summary-hi"
              className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
            >
              हिंदी सारांश (Hindi Summary)
            </label>
            <textarea
              id="lesson-summary-hi"
              rows={4}
              value={generatedLesson.summary_hi}
              onChange={(e) => handleSummaryHiChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 leading-relaxed"
            />
          </div>

          {/* 5 Questions */}
          <div className="space-y-6 pt-2">
            <h4 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              Comprehension Quiz (5 Questions)
            </h4>

            {generatedLesson.quiz?.map((qItem, qIdx) => (
              <div
                key={qIdx}
                className="p-5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={qItem.q}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder={`Question ${qIdx + 1}`}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 3 Options */}
                <div className="space-y-2 pl-8">
                  <p className="text-xs font-medium text-gray-500">
                    Select the radio button next to the correct answer:
                  </p>
                  {qItem.options?.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        id={`q-${qIdx}-opt-${optIdx}`}
                        name={`correct-answer-${qIdx}`}
                        checked={qItem.answer === optIdx}
                        onChange={() => handleAnswerChange(qIdx, optIdx)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIdx, optIdx, e.target.value)
                        }
                        placeholder={`Option ${optIdx + 1}`}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          qItem.answer === optIdx
                            ? 'border-green-500 ring-1 ring-green-500 bg-green-50/30'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Publish action bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setGeneratedLesson(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
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
