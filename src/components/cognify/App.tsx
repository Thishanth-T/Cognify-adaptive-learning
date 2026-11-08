// @ts-nocheck
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth/AuthContext'
import AuthModal from './AuthModal'
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

  const handleSignOut = () => {
    setSelection(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cognify_onboarding_draft')
    }
  }

  return (
    <AuthProvider>
      {selection ? (
        <Dashboard
          initialSelectedConcept={selection.concept}
          initialSubject={selection.subject}
          initialTopic={selection.topic}
          initialLevel={selection.level}
          initialContext={`Selected ${selection.subject} / ${selection.topic} / ${selection.level}`}
          onChangeTopic={() => setSelection(null)}
          onSignOut={handleSignOut}
        />
      ) : (
        <Onboarding
          onStart={(data) => setSelection(data)}
        />
      )}
      <AuthModal />
    </AuthProvider>
  )
}
