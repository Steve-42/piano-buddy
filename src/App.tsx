import { useState } from 'react'
import { HomePage } from './components/HomePage'
import { PracticeView } from './components/PracticeView'
import { HistoryView } from './components/HistoryView'
import { SettingsView } from './components/SettingsView'
import { usePractice } from './hooks/usePractice'

type Page = 'home' | 'practice' | 'history' | 'settings'

function App() {
  const [page, setPage] = useState<Page>('home')
  const practice = usePractice()

  function handleStartPractice() {
    practice.startPractice()
    setPage('practice')
  }

  function handleStopPractice() {
    practice.stopPractice()
  }

  function handleReset() {
    practice.reset()
    setPage('home')
  }

  switch (page) {
    case 'practice':
      return (
        <PracticeView
          status={practice.status}
          activeDuration={practice.activeDuration}
          totalDuration={practice.totalDuration}
          aiMessage={practice.aiMessage}
          error={practice.error}
          debug={practice.debug}
          onStop={handleStopPractice}
          onReset={handleReset}
        />
      )
    case 'history':
      return <HistoryView onBack={() => setPage('home')} />
    case 'settings':
      return <SettingsView onBack={() => setPage('home')} />
    default:
      return (
        <HomePage
          onStartPractice={handleStartPractice}
          onNavigate={(p) => setPage(p)}
        />
      )
  }
}

export default App
