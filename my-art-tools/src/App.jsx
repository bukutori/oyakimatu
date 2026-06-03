import React from 'react';
import SketchWall from './SketchWall';
import InspirationGenerator from './InspirationGenerator';
import ColorPalette from './ColorPalette';

function App() {
  return (
    <div style={{
      padding: '40px 20px',
      backgroundColor: '#121212',
      color: '#e0e0e0',
      minHeight: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '10px' }}>🎨 畫師專用創意工具箱</h1>
        <p style={{ color: '#888' }}>由 React + AI 驅動的創作助手</p>
      </header>

      {/* 儀表板排版：在寬螢幕下會自動分成左右或上下並排 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <SketchWall />
        <InspirationGenerator />
        <ColorPalette />
      </div>
    </div>
  );
}

export default App;