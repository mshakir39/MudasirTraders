import React, { FunctionComponent, ReactNode } from 'react';
import { Dialog } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  children: ReactNode;
  title?: ReactNode;
  dialogPanelClass?: string;
  parentClass?: string;
  preventBackdropClose?: boolean;
  size?: 'large' | 'medium' | 'small';
  dynamicHeight?: boolean;
  fullScreenOnMobile?: boolean;
}

const sizeClasses = {
  small: 'max-w-[95vw] sm:max-w-md',
  medium: 'max-w-[95vw] sm:max-w-2xl md:max-w-3xl',
  large: 'max-w-[95vw] sm:max-w-4xl md:max-w-6xl lg:max-w-7xl',
};

const Modal: FunctionComponent<ModalProps> = ({
  isOpen,
  onOpen,
  onClose,
  children,
  title = 'Modal Title' as ReactNode,
  dialogPanelClass,
  parentClass,
  preventBackdropClose = false,
  size = 'medium',
  dynamicHeight = false,
  fullScreenOnMobile = false,
}) => {
  const defaultPanelClass = `w-full ${sizeClasses[size]} ${fullScreenOnMobile ? 'h-full sm:h-auto sm:rounded-lg' : 'rounded-lg'} shadow-2xl bg-white`;
  const heightClass = dynamicHeight ? '' : 'max-h-[90vh]';
  const containerClass = fullScreenOnMobile 
    ? 'fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-2 sm:p-4'
    : 'fixed inset-0 flex items-center justify-center p-2 sm:p-4';

  return (
    <Dialog
      open={isOpen}
      onClose={preventBackdropClose ? () => {} : onClose || (() => {})}
      className='relative z-50'
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className='fixed inset-0 bg-black/50' aria-hidden='true' />

      {/* Full-screen container to center the panel */}
      <div className={containerClass}>
        {/* The actual dialog panel */}
        <Dialog.Panel
          className={`${defaultPanelClass} ${dialogPanelClass || ''} ${heightClass} ${fullScreenOnMobile ? 'flex flex-col h-full sm:h-auto' : ''}`}
        >
          {/* Header */}
          {title && (
            <div
              className={`${fullScreenOnMobile ? 'sticky top-0 z-10' : ''} border-b border-gray-200 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 px-3 py-4 shadow-lg backdrop-blur-sm sm:px-4 sm:py-6 md:px-6 md:py-8`}
              style={{
                background:
                  'linear-gradient(to right, rgb(30, 58, 138), rgb(29, 78, 216), rgb(37, 99, 235))',
              }}
            >
              <Dialog.Title
                className='text-sm font-bold leading-5 text-white drop-shadow-lg sm:text-base sm:leading-6 md:text-xl md:leading-6'
                style={{ color: 'white !important' }}
              >
                {title}
              </Dialog.Title>
            </div>
          )}

          {/* Content */}
          <div
            className={`${parentClass || 'px-3 py-2 sm:px-4 sm:py-3 md:px-6'} ${fullScreenOnMobile ? 'flex-1 overflow-y-auto' : ''} ${dynamicHeight ? 'overflow-y-auto' : 'overflow-y-auto'}`}
          >
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default Modal;
