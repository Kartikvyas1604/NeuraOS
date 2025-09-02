
import { useState, useRef, useEffect } from 'react';
import { AppWindow } from './Desktop';
import { WindowContent } from './WindowContent';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

interface WindowManagerProps {
  windows: AppWindow[];
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onMaximize: (windowId: string) => void;
  onFocus: (windowId: string) => void;
  onUpdatePosition: (windowId: string, position: { x: number; y: number }) => void;
  onUpdateSize: (windowId: string, size: { width: number; height: number }) => void;
}

export const WindowManager = ({
  windows,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdatePosition,
  onUpdateSize,
}: WindowManagerProps) => {
  const [dragData, setDragData] = useState<{
    windowId: string;
    isDragging: boolean;
    startPos: { x: number; y: number };
    startWindowPos: { x: number; y: number };
  } | null>(null);

  const [resizeData, setResizeData] = useState<{
    windowId: string;
    isResizing: boolean;
    startPos: { x: number; y: number };
    startSize: { width: number; height: number };
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragData?.isDragging) {
        const deltaX = e.clientX - dragData.startPos.x;
        const deltaY = e.clientY - dragData.startPos.y;
        onUpdatePosition(dragData.windowId, {
          x: dragData.startWindowPos.x + deltaX,
          y: dragData.startWindowPos.y + deltaY,
        });
      }

      if (resizeData?.isResizing) {
        const deltaX = e.clientX - resizeData.startPos.x;
        const deltaY = e.clientY - resizeData.startPos.y;
        onUpdateSize(resizeData.windowId, {
          width: Math.max(400, resizeData.startSize.width + deltaX),
          height: Math.max(300, resizeData.startSize.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setDragData(null);
      setResizeData(null);
    };

    if (dragData?.isDragging || resizeData?.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragData, resizeData, onUpdatePosition, onUpdateSize]);

  const handleDragStart = (windowId: string, e: React.MouseEvent) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    setDragData({
      windowId,
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      startWindowPos: window.position,
    });
    onFocus(windowId);
  };

  const handleResizeStart = (windowId: string, e: React.MouseEvent) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    e.stopPropagation();
    setResizeData({
      windowId,
      isResizing: true,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: window.size,
    });
  };

  return (
    <>
      {windows.map((window) => (
        <div
          key={window.id}
          className={`absolute bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-200 ${
            window.isMinimized ? 'hidden' : ''
          }`}
          style={{
            left: window.isMaximized ? 0 : window.position.x,
            top: window.isMaximized ? 0 : window.position.y,
            width: window.isMaximized ? '100vw' : window.size.width,
            height: window.isMaximized ? '100vh' : window.size.height,
            zIndex: window.zIndex,
          }}
          onClick={() => onFocus(window.id)}
        >
          {/* Window Header - always visible, never hidden or locked */}
          <div
            className="bg-black/30 border-b border-white/10 p-3 cursor-move flex items-center justify-between"
            onMouseDown={(e) => !window.isMaximized && handleDragStart(window.id, e)}
          >
            <h3 className="text-white font-medium text-sm">{window.title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onMinimize(window.id)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Minimize"
              >
                <Minus className="h-3 w-3 text-white" />
              </button>
              <button
                onClick={() => onMaximize(window.id)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Maximize"
              >
                {window.isMaximized ? <Square className="h-3 w-3 text-white" /> : <Maximize2 className="h-3 w-3 text-white" />}
              </button>
              <button
                onClick={() => onClose(window.id)}
                className="p-1 hover:bg-red-500/50 rounded transition-colors"
                aria-label="Close"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-hidden h-full">
            <WindowContent window={window} />
          </div>

          {/* Resize Handle */}
          {!window.isMaximized && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(window.id, e)}
            />
          )}
        </div>
      ))}
    </>
  );
};
