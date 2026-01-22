import React, { useState, Suspense } from 'react'

// Import each project's App component by relative path
import SMAPApp from '../../SMAP-HUGE-PROJECT-3-main/App'
import MOCKApp from '../../Copy-of-SSMapMOCKExamination-ANALYTICS---22suc-main/App'
import EXApp from '../../ExercisesAssessmentandReportingsimpler-2-main/ExercisesAssessmentandReportingsimpler-2-main/App'

const apps = [
  { id: 'smap', label: 'SMAP HUGE', Comp: SMAPApp },
  { id: 'mock', label: 'SSMap MOCK', Comp: MOCKApp },
  { id: 'exercise', label: 'Exercises', Comp: EXApp }
]

export default function App() {
  const [active, setActive] = useState('smap')
  const ActiveComp = apps.find(a => a.id === active)!.Comp

  return (
    <div className="min-h-screen">
      <header className="bg-[#0f172a] text-white p-4 flex gap-3 items-center">
        <div className="font-bold">Integrated Launcher</div>
        <nav className="ml-4 flex gap-2">
          {apps.map(a => (
            <button key={a.id} onClick={() => setActive(a.id)} className={`px-3 py-2 rounded ${active===a.id ? 'bg-[#1e40af]':''}`}>
              {a.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-4">
        <Suspense fallback={<div>Loading app...</div>}>
          <div style={{height:'calc(100vh - 72px)'}}>
            <ActiveComp />
          </div>
        </Suspense>
      </main>
    </div>
  )
}
