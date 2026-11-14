import { useState } from 'react'
import {
  Sparkles,
  Wand2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { Card } from '../components/Card'
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

      setSuccessMessage('Lesson published successfully! Students can now access it offline.')
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
  const activeStep = generatedLesson ? 2 : 1

  return (
    <div className="w-full space-y-6 text-left">
      {/* Two-step Indicator Header */}
      <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm" icon={Sparkles}>
                AI-assisted Studio
              </Badge>
              <Badge variant="emerald" size="sm">
                Classes 6–8
              </Badge>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
              AI Curriculum & Assessment Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Transform raw chapter passages into bilingual learning cards with instant comprehension quizzes.
            </p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <div
            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeStep === 1
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-white/[0.02] border-white/10 text-slate-400 opacity-70'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">1 Paste Content</span>
              <span className="text-[11px] text-slate-400 hidden sm:block">Input raw syllabus notes</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
              activeStep === 2
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-white/[0.02] border-white/10 text-slate-400 opacity-70'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">2 Review & Publish</span>
              <span className="text-[11px] text-slate-400 hidden sm:block">Human-in-the-loop audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="w-7 h-7 rounded-lg hover:bg-rose-500/20 flex items-center justify-center cursor-pointer text-base"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 text-sm font-semibold shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuccessMessage(null)}
          >
            Create Another
          </Button>
        </div>
      )}

      {/* Step 1: Input Form (when not reviewing or generating) */}
      {!generatedLesson && !loading && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="chapter-text"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Chapter / Textbook Passage:
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {chapterText.trim().length} / 8000 chars
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <textarea
              id="chapter-text"
              rows={8}
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
              placeholder="Paste English or Hindi chapter excerpts here (minimum 40 characters required for AI analysis)..."
              className="w-full rounded-2xl border border-white/10 dark:border-white/10 border-slate-300 bg-white/[0.02] dark:bg-white/[0.02] bg-slate-50 p-4 text-sm sm:text-base dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500 leading-relaxed font-sans"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-400">
                Supports NCERT science, environmental studies, and mathematics chapters.
              </span>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isTextTooShort}
                icon={Wand2}
                className="w-full sm:w-auto"
              >
                Generate lesson + quiz
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Skeleton Shimmer While Generating */}
      {loading && (
        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/[0.06]">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </Card>
      )}

      {/* Step 2: Editable Preview & Publish Card */}
      {generatedLesson && !loading && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-4">
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold dark:text-white text-slate-900">
                Lesson Preview & Editor
              </h3>
              <p className="text-xs text-slate-400">
                Verify bilingual accuracy and quiz questions before saving to the student catalog.
              </p>
            </div>

            {generatedLesson.mocked && (
              <Badge variant="amber" size="sm" icon={AlertTriangle}>
                Demo Mode: Sample Lesson
              </Badge>
            )}
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-title"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Lesson Title:
            </label>
            <input
              id="lesson-title"
              type="text"
              value={generatedLesson.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/10 dark:border-white/10 border-slate-300 bg-white/[0.03] px-4 py-2 text-base font-bold dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* English Summary */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-summary"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              English Summary (4–5 sentences):
            </label>
            <textarea
              id="lesson-summary"
              rows={4}
              value={generatedLesson.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 dark:border-white/10 border-slate-300 bg-white/[0.03] p-4 text-sm sm:text-base dark:text-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Hindi Summary */}
          <div className="space-y-1.5">
            <label
              htmlFor="lesson-summary-hi"
              className="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              हिंदी सारांश (Hindi Summary):
            </label>
            <textarea
              id="lesson-summary-hi"
              rows={4}
              lang="hi"
              value={generatedLesson.summary_hi}
              onChange={(e) => handleSummaryHiChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 dark:border-white/10 border-slate-300 bg-white/[0.03] p-4 text-sm sm:text-base dark:text-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed font-devanagari"
            />
          </div>

          {/* 5 Questions */}
          <div className="space-y-5 pt-3">
            <h4 className="font-heading text-base font-bold dark:text-white text-slate-900 border-b border-white/[0.06] pb-2">
              Comprehension Questions (5 MCQs)
            </h4>

            {generatedLesson.quiz?.map((qItem, qIdx) => (
              <div
                key={qIdx}
                className="p-4 sm:p-5 rounded-xl border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.02] space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={qItem.q}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder={`Question ${qIdx + 1}`}
                    className="flex-1 min-h-[40px] rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm font-semibold dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3 Options */}
                <div className="space-y-2.5 sm:pl-8">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Select the radio button marking the correct answer:
                  </span>
                  {qItem.options?.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        id={`q-${qIdx}-opt-${optIdx}`}
                        name={`correct-answer-${qIdx}`}
                        checked={qItem.answer === optIdx}
                        onChange={() => handleAnswerChange(qIdx, optIdx)}
                        className="w-4 h-4 text-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIdx, optIdx, e.target.value)
                        }
                        placeholder={`Option ${optIdx + 1}`}
                        className={`flex-1 min-h-[40px] rounded-lg border px-3 py-1.5 text-sm dark:text-slate-200 text-slate-800 bg-white/[0.02] focus:outline-none focus:border-emerald-500 ${
                          qItem.answer === optIdx
                            ? 'border-emerald-500/60 bg-emerald-500/10 font-semibold'
                            : 'border-white/10'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              icon={Trash2}
              onClick={() => setGeneratedLesson(null)}
            >
              Discard Draft
            </Button>

            <Button
              variant="primary"
              size="md"
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
  )
}
