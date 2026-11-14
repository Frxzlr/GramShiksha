import { useState } from 'react'
import {
  Wand2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  FileText,
} from 'lucide-react'
import { Card, CardHeader } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Skeleton } from '../components/Skeleton'

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

      setSuccessMessage('Lesson published successfully. Synced to student devices.')
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
    <div className="w-full space-y-5 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
            Curriculum Studio
          </h2>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
            Convert textbook chapters into bilingual learning cards with auto-generated comprehension assessments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            AI-assisted draft
          </Badge>
          <Badge variant="emerald" size="sm">
            Classes 6–8
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="w-5 h-5 rounded hover:bg-red-500/20 flex items-center justify-center cursor-pointer text-xs"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-[6px] bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] flex items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccessMessage(null)}
            className="h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Source Input */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="space-y-3">
            <CardHeader
              title="Source Passage"
              description="Paste English or Hindi syllabus text"
              badge={
                <span className="text-[11px] font-mono text-zinc-500">
                  {chapterText.trim().length} / 8000
                </span>
              }
            />

            <form onSubmit={handleGenerate} className="space-y-3">
              <textarea
                id="chapter-text"
                rows={12}
                value={chapterText}
                onChange={(e) => setChapterText(e.target.value)}
                placeholder="Paste chapter excerpts here (minimum 40 characters required for AI analysis)..."
                className="w-full rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 p-3 text-[13px] text-white dark:text-white text-zinc-900 focus:outline-none focus:border-[#22c55e] transition-colors placeholder:text-zinc-500 leading-relaxed font-sans"
              />

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isTextTooShort || loading}
                  loading={loading}
                  icon={Wand2}
                  className="w-full"
                >
                  Generate module + quiz
                </Button>

                <p className="text-[11px] text-zinc-500">
                  Supports NCERT science, environmental studies, and mathematics chapters. Requires active server connection.
                </p>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Output / Editor */}
        <div className="lg:col-span-7 space-y-4">
          {loading && (
            <Card className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-[4px]" />
                <Skeleton className="h-3 w-32 rounded-[4px]" />
              </div>
              <Skeleton className="h-9 w-full rounded-[6px]" />
              <Skeleton className="h-24 w-full rounded-[6px]" />
              <Skeleton className="h-24 w-full rounded-[6px]" />
              <div className="space-y-3 pt-3 border-t border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
                <Skeleton className="h-4 w-40 rounded-[4px]" />
                <Skeleton className="h-20 w-full rounded-[6px]" />
                <Skeleton className="h-20 w-full rounded-[6px]" />
              </div>
            </Card>
          )}

          {!loading && !generatedLesson && (
            <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-10 h-10 rounded-[6px] bg-white/[0.04] dark:bg-white/[0.04] bg-zinc-100 border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 flex items-center justify-center text-zinc-400 mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-[14px] font-semibold text-white dark:text-white text-zinc-900 mb-1">
                No Draft Generated Yet
              </h3>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-400 text-zinc-600 max-w-sm">
                Paste syllabus or textbook notes in the left panel and click &quot;Generate module + quiz&quot; to review the bilingual summary and questions.
              </p>
            </Card>
          )}

          {!loading && generatedLesson && (
            <Card className="space-y-4">
              <CardHeader
                title="Lesson Draft"
                description="Review and edit before saving to student devices"
                badge={
                  generatedLesson.mocked ? (
                    <Badge variant="amber" size="sm">
                      Demo Mode
                    </Badge>
                  ) : (
                    <Badge variant="emerald" size="sm" dot>
                      Ready for Review
                    </Badge>
                  )
                }
              />

              {/* Title input */}
              <div className="space-y-1">
                <label
                  htmlFor="lesson-title"
                  className="text-[11px] font-medium uppercase tracking-wider text-zinc-400"
                >
                  Lesson Title
                </label>
                <input
                  id="lesson-title"
                  type="text"
                  value={generatedLesson.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full h-9 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 px-3 text-[13px] font-semibold text-white dark:text-white text-zinc-900 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              {/* English Summary */}
              <div className="space-y-1">
                <label
                  htmlFor="lesson-summary"
                  className="text-[11px] font-medium uppercase tracking-wider text-zinc-400"
                >
                  English Summary
                </label>
                <textarea
                  id="lesson-summary"
                  rows={3}
                  value={generatedLesson.summary}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                  className="w-full rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 p-3 text-[13px] text-zinc-200 dark:text-zinc-200 text-zinc-800 focus:outline-none focus:border-[#22c55e] leading-relaxed"
                />
              </div>

              {/* Hindi Summary */}
              <div className="space-y-1">
                <label
                  htmlFor="lesson-summary-hi"
                  className="text-[11px] font-medium uppercase tracking-wider text-zinc-400"
                >
                  हिंदी सारांश (Hindi Summary)
                </label>
                <textarea
                  id="lesson-summary-hi"
                  rows={3}
                  lang="hi"
                  value={generatedLesson.summary_hi}
                  onChange={(e) => handleSummaryHiChange(e.target.value)}
                  className="w-full rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 p-3 text-[13px] text-zinc-200 dark:text-zinc-200 text-zinc-800 focus:outline-none focus:border-[#22c55e] leading-relaxed font-devanagari"
                />
              </div>

              {/* 5 Questions */}
              <div className="space-y-3 pt-2">
                <div className="text-[12px] font-semibold text-white dark:text-white text-zinc-900 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200 pb-2">
                  Comprehension Questions ({generatedLesson.quiz?.length || 0} MCQs)
                </div>

                {generatedLesson.quiz?.map((qItem, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-[4px] bg-white/[0.06] text-zinc-300 font-mono text-[11px] flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={qItem.q}
                        onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                        placeholder={`Question ${qIdx + 1}`}
                        className="flex-1 h-8 rounded-[4px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-transparent px-2.5 text-[12px] font-medium text-white dark:text-white text-zinc-900 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5 pl-7">
                      {qItem.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`q-${qIdx}-opt-${optIdx}`}
                            name={`correct-answer-${qIdx}`}
                            checked={qItem.answer === optIdx}
                            onChange={() => handleAnswerChange(qIdx, optIdx)}
                            className="w-3.5 h-3.5 text-[#22c55e] accent-[#22c55e] cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(qIdx, optIdx, e.target.value)
                            }
                            placeholder={`Option ${optIdx + 1}`}
                            className={`flex-1 h-7 rounded-[4px] border px-2 text-[12px] text-zinc-200 dark:text-zinc-200 text-zinc-800 bg-transparent focus:outline-none focus:border-[#22c55e] ${
                              qItem.answer === optIdx
                                ? 'border-[#22c55e]/50 bg-[#22c55e]/5'
                                : 'border-white/[0.08] dark:border-white/[0.08] border-zinc-200'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-white/[0.08] dark:border-white/[0.08] border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setGeneratedLesson(null)}
                >
                  Discard Draft
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={handlePublish}
                  loading={publishing}
                  className="w-full sm:w-auto"
                >
                  Publish to students
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
