
import { useState } from 'react'
import Dashboard from './Dashboard'
import Onboarding from './Onboarding'

type LearningSelection = {
  subject: string
  topic: string
  level: string
  concept?: string
}

export default function App() {
  const [selection, setSelection] = useState<LearningSelection | null>(null)

  return (
    selection ? (
      <Dashboard
        initialSelectedConcept={selection.concept}
        initialSubject={selection.subject}
        initialTopic={selection.topic}
        initialLevel={selection.level}
        initialContext={`Selected ${selection.subject} / ${selection.topic} / ${selection.level}`}
      />
    ) : (
      <Onboarding
        onStart={(data) => setSelection(data)}
      />
    )
  )
}
