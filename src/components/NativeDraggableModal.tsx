'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NativeDraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  draggable?: boolean;
}

const sizeClasses = {
  small: 'max-w-sm',
  medium: 'max-w-2xl',
  large: 'max-w-6xl'
};

const NativeDraggableModal: React.FC<NativeDraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  draggable = false
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  // Show/hide dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // Reset position when opening
      setPosition({ x: 0, y: 0 });
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Get current position from computed style
    const dialog = dialogRef.current;
    if (dialog) {
      const transform = window.getComputedStyle(dialog).transform;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          elementStartPos.current = {
            x: parseFloat(values[4]) || 0,
            y: parseFloat(values[5]) || 0
          };
        }
      }
    }
    
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggable) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = elementStartPos.current.x + deltaX;
      const newY = elementStartPos.current.y + deltaY;

      setPosition({ x: newX, y: newY });

      const dialog = dialogRef.current;
      if (dialog) {
        dialog.style.transform = `translate(${newX}px, ${newY}px)`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, draggable]);

  const handleDialogClose = () => {
    setPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`backdrop:bg-black/50 backdrop:backdrop-blur-sm ${sizeClasses[size]} w-full rounded-lg shadow-2xl border border-gray-200 ${draggable ? 'cursor-move' : ''}`}
      onClose={handleDialogClose}
      style={{
        ...(draggable && {
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        })
      }}
    >
      {/* Header */}
      {title && (
        <div
          className={`flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-600 px-6 py-4 ${draggable ? 'cursor-move hover:cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {draggable && (
            <div className="flex items-center gap-2 text-white/80 text-xs bg-white/10 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
              Drag to move
            </div>
          )}
          <button
            onClick={handleDialogClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </dialog>
  );
};

export default NativeDraggableModal;
