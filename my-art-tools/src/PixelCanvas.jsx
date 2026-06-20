import React, { useState, useRef, useEffect } from 'react';
import pencilIcon from './img/pencil.png';
import bucketIcon from './img/bucket.png';
import eyeDropperIcon from './img/eyeDropper.png';
import eraserIcon from './img/eraser.png';
import rectIcon from './img/rect.png';
import circleIcon from './img/circle.png';
import selectMoveIcon from './img/selectMove.png';
import gomibakoIcon from './img/gomibako.png';

export default function PixelCanvas({ t, isLight, currentTheme }) {
  const [gridSize, setGridSize] = useState(16);
  const [pixels, setPixels] = useState([]);
  const [currentColor, setCurrentColor] = useState('#ff0000');
  // 工具選項：pencil, bucket, eyeDropper, eraser, rect, circle, selectMove
  const [currentTool, setCurrentTool] = useState('pencil'); 
  const [brushSize, setBrushSize] = useState(1);
  
  // HSV 狀態
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [value, setValue] = useState(100);

  const [history, setHistory] = useState([]);
  const isMouseDown = useRef(false);
  const startCoord = useRef(null);
  const lastCoords = useRef(null);
  const shapeBaseState = useRef(null); 

  // 圈選功能專用狀態
  const [selectRect, setSelectRect] = useState(null); 
  const [isMovingSelection, setIsMovingSelection] = useState(false); 
  const selectionData = useRef(null); 
  const [selectionOffset, setSelectionOffset] = useState({ x: 0, y: 0 }); 

  // 調色盤 Canvas Ref
  const colorCanvasRef = useRef(null);
  const isColorMouseDown = useRef(false);

  // 像素畫布 Ref
  const pixelCanvasRef = useRef(null);

  // 安全的多語系包裝函式
  const safeT = (key, fallback) => (t ? t(key) : fallback);

  // 初始化畫布
  useEffect(() => {
    const initialPixels = Array(gridSize * gridSize).fill('');
    setPixels(initialPixels);
    setHistory([initialPixels]);
    resetSelection();
  }, [gridSize]);

  // 當 HSV 改變時更新顏色
  useEffect(() => {
    setCurrentColor(hsvToHex(hue, saturation, value));
  }, [hue, saturation, value]);

  // 渲染調色盤漸層
  useEffect(() => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    const gradientWhite = ctx.createLinearGradient(0, 0, width, 0);
    gradientWhite.addColorStop(0, 'rgba(255,255,255,1)');
    gradientWhite.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradientWhite;
    ctx.fillRect(0, 0, width, height);

    const gradientBlack = ctx.createLinearGradient(0, height, 0, 0);
    gradientBlack.addColorStop(0, 'rgba(0,0,0,1)');
    gradientBlack.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradientBlack;
    ctx.fillRect(0, 0, width, height);
  }, [hue]);

  // 全域放開滑鼠監聽
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDown.current = false;
      isColorMouseDown.current = false;
      setIsMovingSelection(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // 處理調色盤選色邏輯
  const handleColorChoose = (e) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const sPercent = Math.round((x / rect.width) * 100);
    const vPercent = Math.round((1 - y / rect.height) * 100);
    
    setSaturation(sPercent);
    setValue(vPercent);
  };

  // 監聽調色盤滑鼠移動
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isColorMouseDown.current) {
        handleColorChoose(e);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // 重置圈選狀態
  const resetSelection = () => {
    setSelectRect(null);
    setIsMovingSelection(false);
    selectionData.current = null;
    setSelectionOffset({ x: 0, y: 0 });
  };

  function hsvToHex(h, s, v) {
    s /= 100; v /= 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => v * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
  }

  // 歷史紀錄
  const saveToHistory = (newPixels) => {
    setHistory((prevHistory) => {
      const updated = [...prevHistory, newPixels];
      if (updated.length > 21) updated.shift(); 
      return updated;
    });
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const prevHistory = [...history];
      prevHistory.pop();
      setPixels(prevHistory[prevHistory.length - 1]);
      setHistory(prevHistory);
      resetSelection();
    }
  };

  // 監聽 Ctrl + Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  const clearCanvas = () => {
    const cleared = Array(gridSize * gridSize).fill('');
    setPixels(cleared);
    saveToHistory(cleared);
    resetSelection();
  };

  // 左右翻轉功能
  const flipHorizontal = () => {
    if (selectionData.current) {
      commitSelectionMove();
    }
    const flipped = Array(gridSize * gridSize).fill('');
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const sourceIdx = r * gridSize + c;
        const targetIdx = r * gridSize + (gridSize - 1 - c);
        flipped[targetIdx] = pixels[sourceIdx];
      }
    }
    setPixels(flipped);
    saveToHistory(flipped);
    resetSelection();
  };

  const getIndex = (r, c) => r * gridSize + c;

  // 油漆桶
  const floodFill = (startIndex, targetColor) => {
    const newPixels = [...pixels];
    const startColor = newPixels[startIndex];
    if (startColor === targetColor) return;

    const queue = [startIndex];
    while (queue.length > 0) {
      const curr = queue.shift();
      if (newPixels[curr] !== startColor) continue;

      newPixels[curr] = targetColor;
      const r = Math.floor(curr / gridSize);
      const c = curr % gridSize;

      if (r > 0) queue.push(getIndex(r - 1, c));
      if (r < gridSize - 1) queue.push(getIndex(r + 1, c));
      if (c > 0) queue.push(getIndex(r, c - 1));
      if (c < gridSize - 1) queue.push(getIndex(r, c + 1));
    }
    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  const drawPixelOnArray = (arr, centerX, centerY, tool, color, size) => {
    const radius = size - 1;
    const halfRadius = Math.floor(radius / 2);
    for (let dy = -halfRadius; dy <= halfRadius; dy++) {
      for (let dx = -halfRadius; dx <= halfRadius; dx++) {
        const targetX = centerX + dx;
        const targetY = centerY + dy;
        if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
          const idx = getIndex(targetY, targetX);
          if (tool === 'pencil') arr[idx] = color;
          if (tool === 'eraser') arr[idx] = '';
        }
      }
    }
  };

  // Bresenham 直線連線演算法（防止劃太快斷筆）
  const drawLine = (x0, y0, x1, y1) => {
    const newPixels = [...pixels];
    if (currentTool === 'bucket') {
      floodFill(getIndex(y1, x1), currentColor);
      return;
    }
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0; let y = y0;

    while (true) {
      drawPixelOnArray(newPixels, x, y, currentTool, currentColor, brushSize);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    setPixels(newPixels);
  };

  const drawShape = (x1, y1, isFinal = false) => {
    if (!startCoord.current) return;
    const x0 = startCoord.current.x;
    const y0 = startCoord.current.y;

    // Use the saved base state for shape preview, or current pixels for final
    const basePixels = shapeBaseState.current ? [...shapeBaseState.current] : [...pixels];

    if (currentTool === 'rect') {
      const minX = Math.min(x0, x1); const maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1); const maxY = Math.max(y0, y1);
      // Draw rectangle edges
      for (let x = minX; x <= maxX; x++) {
        drawPixelOnArray(basePixels, x, minY, 'pencil', currentColor, brushSize);
        drawPixelOnArray(basePixels, x, maxY, 'pencil', currentColor, brushSize);
      }
      for (let y = minY; y <= maxY; y++) {
        drawPixelOnArray(basePixels, minX, y, 'pencil', currentColor, brushSize);
        drawPixelOnArray(basePixels, maxX, y, 'pencil', currentColor, brushSize);
      }
    } else if (currentTool === 'circle') {
      const r = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
      // Use dynamic tolerance for better circle rendering
      const tolerance = Math.max(0.6, r * 0.1);
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const dist = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
          if (Math.abs(dist - r) < tolerance) {
            drawPixelOnArray(basePixels, x, y, 'pencil', currentColor, brushSize);
          }
        }
      }
    }
    setPixels(basePixels);
    if (isFinal) {
      saveToHistory(basePixels);
      shapeBaseState.current = null;
    }
  };

  const commitSelectionMove = () => {
    if (!selectionData.current) return;
    saveToHistory(pixels);
    resetSelection();
  };

  const cancelSelectionMove = () => {
    setPixels([...history[history.length - 1]]);
    resetSelection();
  };

  const handlePixelMouseDown = (index) => {
    const r = Math.floor(index / gridSize);
    const c = index % gridSize;

    if (currentTool === 'eyeDropper') {
      if (pixels[index]) setCurrentColor(pixels[index]);
      setCurrentTool('pencil');
      return;
    }

    isMouseDown.current = true;
    startCoord.current = { x: c, y: r };
    lastCoords.current = { x: c, y: r };

    // Save current state before starting shape drawing
    if (currentTool === 'rect' || currentTool === 'circle') {
      shapeBaseState.current = [...pixels];
    }

    if (currentTool === 'selectMove') {
      const currentBoxX = selectRect ? selectRect.x + selectionOffset.x : -1;
      const currentBoxY = selectRect ? selectRect.y + selectionOffset.y : -1;

      if (selectRect && 
          c >= currentBoxX && c < currentBoxX + selectRect.w &&
          r >= currentBoxY && r < currentBoxY + selectRect.h) {
        setIsMovingSelection(true);
        if (!selectionData.current) {
          const snapshot = [];
          const currentCanvasState = [...pixels];
          for (let sy = 0; sy < selectRect.h; sy++) {
            for (let sx = 0; sx < selectRect.w; sx++) {
              const srcIdx = getIndex(selectRect.y + sy, selectRect.x + sx);
              snapshot.push(currentCanvasState[srcIdx]);
              currentCanvasState[srcIdx] = ''; 
            }
          }
          selectionData.current = snapshot;
          setPixels(currentCanvasState);
        }
      } else {
        if (selectionData.current) commitSelectionMove();
        resetSelection();
        setSelectRect({ x: c, y: r, w: 1, h: 1 });
      }
      return;
    }

    if (currentTool === 'pencil' || currentTool === 'eraser' || currentTool === 'bucket') {
      drawLine(c, r, c, r);
    } else if (currentTool === 'rect' || currentTool === 'circle') {
      drawShape(c, r);
    }
  };

  const handlePixelMouseEnter = (index) => {
    if (!isMouseDown.current) return;
    const r = Math.floor(index / gridSize);
    const c = index % gridSize;

    if (currentTool === 'selectMove') {
      if (isMovingSelection && startCoord.current && selectRect && selectionData.current) {
        const deltaX = c - startCoord.current.x;
        const deltaY = r - startCoord.current.y;
        const newOffset = {
          x: selectionOffset.x + deltaX,
          y: selectionOffset.y + deltaY
        };

        const cleanBase = [...history[history.length - 1]];
        for (let sy = 0; sy < selectRect.h; sy++) {
          for (let sx = 0; sx < selectRect.w; sx++) {
            cleanBase[getIndex(selectRect.y + sy, selectRect.x + sx)] = '';
          }
        }

        let dataIdx = 0;
        for (let sy = 0; sy < selectRect.h; sy++) {
          for (let sx = 0; sx < selectRect.w; sx++) {
            const tx = selectRect.x + newOffset.x + sx;
            const ty = selectRect.y + newOffset.y + sy;
            if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
              cleanBase[getIndex(ty, tx)] = selectionData.current[dataIdx];
            }
            dataIdx++;
          }
        }
        setSelectionOffset(newOffset);
        setPixels(cleanBase);
        startCoord.current = { x: c, y: r };
      } else if (!isMovingSelection && startCoord.current) {
        const x0 = startCoord.current.x; const y0 = startCoord.current.y;
        setSelectRect({ x: Math.min(x0, c), y: Math.min(y0, r), w: Math.abs(c - x0) + 1, h: Math.abs(r - y0) + 1 });
      }
      return;
    }

    // Shape drawing is handled by global mouse move handler
    if (currentTool === 'rect' || currentTool === 'circle') {
      return;
    }

    if (lastCoords.current) {
      drawLine(lastCoords.current.x, lastCoords.current.y, c, r);
      lastCoords.current = { x: c, y: r };
    }
  };

  const handlePixelMouseUp = () => {
    if (!isMouseDown.current) return;
    if (currentTool === 'rect' || currentTool === 'circle') {
      if (lastCoords.current) drawShape(lastCoords.current.x, lastCoords.current.y, true);
      else if (startCoord.current) drawShape(startCoord.current.x, startCoord.current.y, true);
      saveToHistory(pixels);
    } else if (currentTool !== 'selectMove') {
      saveToHistory(pixels);
    }
    isMouseDown.current = false;
  };

  const exportToPNG = () => {
    if (selectionData.current) commitSelectionMove();
    const exportSize = 512; const pixelSize = exportSize / gridSize;
    const canvas = document.createElement('canvas'); canvas.width = exportSize; canvas.height = exportSize;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    pixels.forEach((color, index) => {
      if (color) {
        const r = Math.floor(index / gridSize); const c = index % gridSize;
        ctx.fillStyle = color; ctx.fillRect(c * pixelSize, r * pixelSize, Math.ceil(pixelSize), Math.ceil(pixelSize));
      }
    });
    const link = document.createElement('a'); link.download = `pixel-art-${gridSize}x${gridSize}.png`; link.href = canvas.toDataURL('image/png'); link.click();
  };

  // --- 🎨 整合主專案佈局樣式設定 ---
  const styles = {
    container: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'transparent',
      color: currentTheme?.text || (isLight ? '#334155' : '#f8fafc'),
      display: 'flex', flexDirection: 'row',
      fontFamily: 'inherit', userSelect: 'none', overflow: 'hidden',
      boxSizing: 'border-box'
    },
    leftSidebar: {
      width: '320px', height: '100%', 
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(20px)',
      padding: '20px', 
      borderRight: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', 
      display: 'flex', flexDirection: 'column', gap: '16px', 
      boxShadow: '4px 0px 15px rgba(0,0,0,0.05)', zIndex: 10, overflowY: 'auto', boxSizing: 'border-box'
    },
    sectionTitle: { fontSize: '12px', fontWeight: 'bold', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    select: {
      backgroundColor: isLight ? '#ffffff' : '#1e293b', 
      color: currentTheme?.text || (isLight ? '#334155' : '#f8fafc'), 
      border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
      borderRadius: '8px', padding: '8px', outline: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold'
    },
    toolGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' },
    toolBtn: (active) => ({
      padding: '12px 2px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
      border: active ? `2px solid ${currentTheme?.primary || '#3b82f6'}` : (isLight ? '1px solid #cbd5e1' : '1px solid #475569'),
      backgroundColor: active ? (isLight ? '#e0f2fe' : '#0369a1') : (isLight ? '#ffffff' : '#1e293b'),
      color: currentTheme?.text || (isLight ? '#334155' : '#f8fafc'),
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease'
    }),
    // 🔄 精準控制按鈕內圖片預留區的大小
    imagePlaceholder: {
      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b', backgroundColor: isLight ? '#e2e8f0' : '#334155', borderRadius: '4px'
    },
    brushRow: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: isLight ? '#ffffff' : '#1e293b', padding: '6px 10px', borderRadius: '8px', border: isLight ? '1px solid #cbd5e1' : '1px solid #475569' },
    brushSlider: { flex: 1, cursor: 'pointer', accentColor: currentTheme?.primary || '#3b82f6' },
    brushIndicator: { fontSize: '12px', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' },
    actionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
    actionBtn: (isDanger) => ({
      padding: '12px', 
      backgroundColor: isDanger ? '#fee2e2' : (isLight ? '#ffffff' : '#1e293b'), 
      border: isDanger ? '1px solid #fca5a5' : (isLight ? '1px solid #cbd5e1' : '1px solid #475569'), 
      borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isDanger ? '#dc2626' : (currentTheme?.text || (isLight ? '#334155' : '#f8fafc'))
    }),
    undoDisabledBtn: {
      padding: '12px', backgroundColor: isLight ? '#f1f5f9' : '#0f172a', border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b', borderRadius: '8px',
      color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    commitRow: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px', padding: '8px', backgroundColor: isLight ? '#fffbeb' : '#451a03', border: '1px dashed #f59e0b', borderRadius: '8px'
    },
    confirmBtn: { padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    cancelBtn: { padding: '8px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },

    pickerWrapper: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', backgroundColor: isLight ? '#ffffff' : '#1e293b', borderRadius: '8px', border: isLight ? '1px solid #cbd5e1' : '1px solid #475569' },
    canvasContainer: { position: 'relative', width: '100%', height: '140px', overflow: 'hidden', borderRadius: '6px', border: isLight ? '1px solid #cbd5e1' : '1px solid #475569' },
    colorCanvas: { width: '100%', height: '100%', cursor: 'crosshair', display: 'block' },
    colorCursor: {
      position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #ffffff', boxShadow: '0 0 3px rgba(0,0,0,0.8)',
      left: `${saturation}%`, bottom: `${value}%`, transform: 'translate(-5px, 5px)', pointerEvents: 'none'
    },
    hueSlider: {
      width: '100%', height: '12px', borderRadius: '6px', cursor: 'pointer', outline: 'none', appearance: 'none',
      background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
    },
    colorInfoRow: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' },
    colorPreviewBlock: { width: '32px', height: '32px', borderRadius: '6px', border: isLight ? '1px solid #cbd5e1' : '1px solid #475569', backgroundColor: currentColor },
    colorHexText: { flex: 1, padding: '4px', border: isLight ? '1px solid #cbd5e1' : '1px solid #475569', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', backgroundColor: isLight ? '#fff' : '#0f172a', color: isLight ? '#000' : '#fff' },
    exportBtn: {
      padding: '12px', backgroundColor: currentTheme?.primary || '#3b82f6', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', border: 'none',
      cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    
    canvasWorkspace: {
      flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '40px'
    },
    canvasGroup: {
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '32px'
    },
    rightCanvasArea: {
      position: 'relative', padding: '16px', 
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', 
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    canvas: {
      display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
      width: 'min(55vw, 70vh, 550px)', height: 'min(55vw, 70vh, 550px)', backgroundColor: '#fff', overflow: 'hidden',
      borderRadius: '4px', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
    },
    pixel: (color) => ({ backgroundColor: color || 'transparent', cursor: 'crosshair', pointerEvents: currentTool === 'rect' || currentTool === 'circle' ? 'none' : 'auto' }),
    
    sideButtonGroup: { display: 'flex', flexDirection: 'column' },
    sideActionBtn: {
      padding: '12px', 
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 41, 59, 0.6)',
      border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '12px',
      color: currentTheme?.text || (isLight ? '#334155' : '#f8fafc'),
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 【左側工具列】 */}
      <div style={styles.leftSidebar}>
        
        {/* 尺寸 ── 透過多語系包裝 */}
        <div style={styles.controlGroup}>
          <div style={styles.sectionTitle}>{safeT('gridSize', '尺寸')}</div>
          <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} style={styles.select}>
            <option value={16}>16 x 16</option>
            <option value={32}>32 x 32</option>
            <option value={64}>64 x 64</option>
          </select>
        </div>

        {/* 工具箱 ── 7個按鈕全數去除固定標題文字，並加上多語系懸停提示 */}
        <div style={styles.controlGroup}>
          <div style={styles.toolGrid}>
            <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('pencil'); }} style={styles.toolBtn(currentTool === 'pencil')} title={safeT('pencil', '鉛筆')}>
              <img src={pencilIcon} alt="鉛筆" style={{ width: '42px', height: '42px' }} />
            </button>
             <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('eraser'); }} style={styles.toolBtn(currentTool === 'eraser')} title={safeT('eraser', '橡皮擦')}>
              <img src={eraserIcon} alt="橡皮擦" style={{ width: '38px', height: '38px' }} />
            </button>
            <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('bucket'); }} style={styles.toolBtn(currentTool === 'bucket')} title={safeT('bucket', '油漆桶')}>
              <img src={bucketIcon} alt="油漆桶" style={{ width: '38px', height: '38px' }} />
            </button>
            <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('eyeDropper'); }} style={styles.toolBtn(currentTool === 'eyeDropper')} title={safeT('eyeDropper', '吸管')}>
              <img src={eyeDropperIcon} alt="吸管" style={{ width: '38px', height: '38px' }} />
            </button>
        
            <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('rect'); }} style={styles.toolBtn(currentTool === 'rect')} title={safeT('rect', '正方形繪製')}>
              <img src={rectIcon} alt="矩形" style={{ width: '38px', height: '38px' }} />
            </button>
            <button onClick={() => { if(selectionData.current) commitSelectionMove(); setCurrentTool('circle'); }} style={styles.toolBtn(currentTool === 'circle')} title={safeT('circle', '圓形繪製')}>
              <img src={circleIcon} alt="圓形" style={{ width: '40px', height: '40px' }} />
            </button>
            <button onClick={() => setCurrentTool('selectMove')} style={styles.toolBtn(currentTool === 'selectMove')} title={safeT('selectMove', '圈選移動')}>
              <img src={selectMoveIcon} alt="圈選" style={{ width: '38px', height: '38px' }} />
            </button>
          </div>

          {/* 挪動確認框 */}
          {selectionData.current && (
            <div style={styles.commitRow}>
              <button onClick={commitSelectionMove} style={styles.confirmBtn} title={safeT('confirmMove', '確定移動位置')}>📌</button>
              <button onClick={cancelSelectionMove} style={styles.cancelBtn} title={safeT('cancelSelection', '取消選區恢復原狀')}>✕</button>
            </div>
          )}
        </div>

        {/* 筆刷大小 ── 透過多語系包裝 */}
        <div style={styles.controlGroup}>
          <div style={styles.sectionTitle}>{safeT('brushSize', '筆刷大小')}</div>
          <div style={styles.brushRow}>
            <input type="range" min="1" max="4" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={styles.brushSlider} />
            <span style={styles.brushIndicator}>{brushSize} px</span>
          </div>
        </div>

        {/* 歷史紀錄 ── 純懸停提示 */}
        <div style={styles.controlGroup}>
          <div style={styles.actionRow}>
            {history.length > 1 ? (
              <button onClick={handleUndo} style={styles.actionBtn(false)} title={safeT('undo', '復原上一步 (Ctrl+Z)')}>↩️ ({history.length - 1})</button>
            ) : (
              <button style={styles.undoDisabledBtn} disabled title={safeT('noHistory', '目前無歷史紀錄')}>↩️</button>
            )}
            <button onClick={clearCanvas} style={styles.actionBtn(true)} title={safeT('clearCanvas', '一鍵清空畫布')}>
              <img src={gomibakoIcon} alt="清空畫布" style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
        </div>

        {/* 調色盤 */}
        <div style={styles.controlGroup}>
          <div style={styles.pickerWrapper}>
            <div style={styles.canvasContainer}>
              <canvas 
                ref={colorCanvasRef} width={250} height={140} style={styles.colorCanvas}
                onMouseDown={(e) => { isColorMouseDown.current = true; handleColorChoose(e); }}
              />
              <div style={styles.colorCursor} />
            </div>
            <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(Number(e.target.value))} style={styles.hueSlider} />
            <div style={styles.colorInfoRow}>
              <div style={styles.colorPreviewBlock} />
              <input type="text" value={currentColor} readOnly style={styles.colorHexText} />
            </div>
          </div>
        </div>

        {/* 導出按鈕 ── 純懸停提示 */}
        <button onClick={exportToPNG} style={styles.exportBtn} title={safeT('exportImage', '導出高解析度 PNG 圖片')}>
          💾
        </button>
      </div>

      {/* 【右側大工作區】 */}
      <div style={styles.canvasWorkspace}>
        <div style={styles.canvasGroup}>
          
          <div style={styles.rightCanvasArea}>
            <div
              ref={pixelCanvasRef}
              style={styles.canvas}
              onMouseDown={(e) => {
                if (currentTool !== 'rect' && currentTool !== 'circle') return;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const pixelSize = rect.width / gridSize;
                const c = Math.floor(x / pixelSize);
                const r = Math.floor(y / pixelSize);

                if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
                  const index = getIndex(r, c);
                  handlePixelMouseDown(index);
                }
              }}
              onMouseMove={(e) => {
                if (!isMouseDown.current || !startCoord.current) return;
                if (currentTool !== 'rect' && currentTool !== 'circle') return;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const pixelSize = rect.width / gridSize;
                const c = Math.floor(x / pixelSize);
                const r = Math.floor(y / pixelSize);

                if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
                  drawShape(c, r);
                  lastCoords.current = { x: c, y: r };
                }
              }}
              onMouseUp={() => {
                if (currentTool === 'rect' || currentTool === 'circle') {
                  handlePixelMouseUp();
                }
              }}
            >
              {pixels.map((color, index) => {
                const r = Math.floor(index / gridSize);
                const c = index % gridSize;
                const defaultGridColor = (r + c) % 2 === 0 ? '#ffffff' : '#e5e7eb';

                let isSelected = false;
                if (selectRect) {
                  const currentBoxX = selectRect.x + selectionOffset.x;
                  const currentBoxY = selectRect.y + selectionOffset.y;
                  const inX = c >= currentBoxX && c < currentBoxX + selectRect.w;
                  const inY = r >= currentBoxY && r < currentBoxY + selectRect.h;
                  if (inX && inY) isSelected = true;
                }

                return (
                  <div
                    key={index}
                    onMouseDown={() => handlePixelMouseDown(index)}
                    onMouseEnter={() => handlePixelMouseEnter(index)}
                    onMouseUp={handlePixelMouseUp}
                    style={{
                      ...styles.pixel(color),
                      backgroundColor: color || defaultGridColor,
                      outline: isSelected ? '1px dashed #ef4444' : 'none',
                      outlineOffset: isSelected ? '-1px' : '0',
                      border: isLight ? '0.5px solid rgba(0, 0, 0, 0.05)' : '0.5px solid rgba(255, 255, 255, 0.05)',
                      zIndex: isSelected ? 5 : 1
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 左右翻轉按鈕列 ── 純懸停提示 */}
          <div style={styles.sideButtonGroup}>
            <button onClick={flipHorizontal} style={styles.sideActionBtn} title={safeT('flipHorizontal', '左右翻轉畫布')}>
              <span>↔️</span>
            </button>
          </div>
          
        </div>
      </div>

    </div>
  );
}