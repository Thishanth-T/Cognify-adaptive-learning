// @ts-nocheck -- imported from original Cognify project (looser TS settings)

import { useState } from 'react'

type OnboardingData = {
  subject: string
  topic: string
  level: string
  concept?: string
}

const subjectTopics: Record<string, string[]> = {
  'C++': [
    'Prerequisites', 'Variables', 'Data Types', 'Arrays',
    'Pointers', 'Memory', 'Functions', 'Recursion', 'OOP',
    'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming'
  ],
  Python: [
    'Basics', 'Variables', 'Strings', 'Lists and Tuples',
    'Dictionaries', 'Functions', 'Recursion', 'OOP',
    'File Handling', 'Data Structures'
  ],
  Java: [
    'Basics', 'Variables', 'Arrays', 'Functions',
    'OOP', 'Inheritance', 'Interfaces', 'Collections'
  ],
  JavaScript: [
    'Basics', 'Variables', 'Functions', 'Arrays',
    'Objects', 'DOM Manipulation', 'Promises', 'APIs'
  ],
  'Web Development': [
    'HTML', 'CSS', 'JavaScript', 'React',
    'Responsive Design', 'APIs', 'Backend Basics'
  ],
  'Data Structures & Algorithms': [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks',
    'Queues', 'Trees', 'Graphs', 'Sorting',
    'Binary Search', 'Recursion', 'Dynamic Programming'
  ],
  'Artificial Intelligence': [
    'AI Fundamentals', 'Neural Networks',
    'Natural Language Processing', 'AI Agents',
    'Generative AI', 'Responsible AI'
  ],
  'Machine Learning': [
    'ML Fundamentals', 'Data Preprocessing',
    'Linear Regression', 'Classification',
    'Clustering', 'Neural Networks', 'Model Evaluation'
  ],
  Mathematics: [
    'Algebra', 'Calculus', 'Statistics', 'Matrices',
    'Probability', 'Differentiation', 'Integration',
    'Eigenvalues and Eigenvectors', 'Trigonometry'
  ],
  Physics: [
    'Mechanics', 'Motion', 'Work and Energy',
    'Electricity', 'Magnetism', 'Waves', 'Optics'
  ],
  Chemistry: [
    'Atomic Structure', 'Chemical Bonding',
    'Periodic Table', 'Thermodynamics',
    'Organic Chemistry', 'Equilibrium'
  ],
}

const selectClass =
  'w-full p-3 rounded-lg bg-slate-900 text-white border border-white/20 focus:outline-none focus:border-violet-400'

const inputClass = selectClass

const optionClass = 'bg-slate-900 text-white'

export default function Onboarding({
  onStart,
}: {
  onStart: (data: OnboardingData) => void
}) {
  const [subject, setSubject] = useState('C++')
  const [customSubject, setCustomSubject] = useState('')
  const [useCustomSubject, setUseCustomSubject] = useState(false)

  const [topic, setTopic] = useState('Prerequisites')
  const [customTopic, setCustomTopic] = useState('')
  const [useCustomTopic, setUseCustomTopic] = useState(false)

  const [level, setLevel] = useState('Beginner')

  const activeSubject = useCustomSubject
    ? customSubject.trim()
    : subject

  const topicsFor = (s: string) =>
    subjectTopics[s] ?? [
      'Introduction',
      'Fundamentals',
      'Applications',
    ]

  const handleSubjectChange = (value: string) => {
    if (value === '__custom__') {
      setUseCustomSubject(true)
      setCustomSubject('')
      setTopic('Introduction')
    } else {
      setUseCustomSubject(false)
      setCustomSubject('')
      setSubject(value)
      setTopic(topicsFor(value)[0])
    }

    setUseCustomTopic(false)
    setCustomTopic('')
  }

  const start = () => {
    const finalSubject = activeSubject
    const finalTopic = useCustomTopic
      ? customTopic.trim()
      : topic

    if (!finalSubject || !finalTopic) return

    let concept: string | undefined

    if (finalSubject.toLowerCase() === 'c++') {
      const lowerTopic = finalTopic.toLowerCase()

      if (lowerTopic.includes('pointer')) {
        concept = 'pointers'
      } else if (lowerTopic.includes('memory')) {
        concept = 'memory'
      } else if (
        ['prerequisites', 'variables', 'basics', 'data types'].includes(
          lowerTopic,
        )
      ) {
        concept = 'vars'
      }
    }

    onStart({
      subject: finalSubject,
      topic: finalTopic,
      level,
      concept,
    })
  }

  const availableTopics = topicsFor(activeSubject)

  return (
    <div className="min-h-screen w-screen bg-[var(--cognify-bg)] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl p-6 sm:p-8 bg-panel panel-border rounded-xl">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome to Cognify
        </h2>

        <p className="text-sm text-[var(--muted)] mb-6">
          Your personal learning space. Choose a subject and topic,
          or create your own learning path.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Subject
            </label>

            <select
              className={selectClass}
              value={useCustomSubject ? '__custom__' : subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              {Object.keys(subjectTopics).map((name) => (
                <option key={name} value={name} className={optionClass}>
                  {name}
                </option>
              ))}

              <option value="__custom__" className={optionClass}>
                + Enter your own subject
              </option>
            </select>

            {useCustomSubject && (
              <input
                className={`${inputClass} mt-3`}
                value={customSubject}
                onChange={(e) => {
                  setCustomSubject(e.target.value)
                  setTopic('Introduction')
                }}
                placeholder="e.g. Cybersecurity, Economics, Biology..."
                maxLength={100}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Topic
            </label>

            <select
              className={selectClass}
              value={useCustomTopic ? '__custom__' : topic}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setUseCustomTopic(true)
                  setCustomTopic('')
                } else {
                  setTopic(e.target.value)
                  setUseCustomTopic(false)
                  setCustomTopic('')
                }
              }}
            >
              {availableTopics.map((name) => (
                <option key={name} value={name} className={optionClass}>
                  {name}
                </option>
              ))}

              <option value="__custom__" className={optionClass}>
                + Enter your own topic
              </option>
            </select>

            {useCustomTopic && (
              <input
                className={`${inputClass} mt-3`}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. SQL Injection, Supply and Demand..."
                maxLength={150}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Experience Level
            </label>

            <select
              className={selectClass}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option className={optionClass}>Beginner</option>
              <option className={optionClass}>Basic knowledge</option>
              <option className={optionClass}>Intermediate</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              className="px-6 py-3 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={start}
              disabled={
                !activeSubject ||
                !(useCustomTopic ? customTopic.trim() : topic)
              }
            >
              Start Learning →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
