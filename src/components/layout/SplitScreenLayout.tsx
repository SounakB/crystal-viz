import type { ReactNode } from 'react'

interface SplitScreenLayoutProps {
  theoryContent: ReactNode
  visualContent: ReactNode
  title: string
}

export function SplitScreenLayout({ theoryContent, visualContent, title }: SplitScreenLayoutProps) {
  return (
    <div className="split-screen-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        className="split-screen-layout__sidebar"
        style={{
          width: 400,
          minWidth: 320,
          padding: '24px',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <header>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>{theoryContent}</div>
      </aside>

      <main
        className="split-screen-layout__visual"
        style={{
          flex: 1,
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {visualContent}
      </main>
    </div>
  )
}
