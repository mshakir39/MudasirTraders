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
}

const sizeClasses = {
  small: 'max-w-sm sm:max-w-md',
  medium: 'max-w-2xl sm:max-w-3xl',
  large: 'max-w-6xl sm:max-w-7xl',
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
}) => {
  const defaultPanelClass = `w-full ${sizeClasses[size]} rounded-lg shadow-2xl  bg-white`;
  const heightClass = dynamicHeight ? '' : 'max-h-[90vh]';

  return (
    <Dialog
      open={isOpen}
      onClose={preventBackdropClose ? () => {} : onClose || (() => {})}
      className='relative z-50'
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className='fixed inset-0 bg-black/50' aria-hidden='true' />

      {/* Full-screen container to center the panel */}
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        {/* The actual dialog panel */}
        <Dialog.Panel
          className={`${defaultPanelClass} ${dialogPanelClass || ''} ${heightClass}`}
        >
          {/* Header */}
          {title && (
            <div
              className='border-b border-gray-200 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 px-4 py-6 shadow-lg backdrop-blur-sm sm:px-6 sm:py-8'
              style={{
                background:
                  'linear-gradient(to right, rgb(30, 58, 138), rgb(29, 78, 216), rgb(37, 99, 235))',
              }}
            >
              <Dialog.Title
                className='text-base font-bold leading-5 text-white drop-shadow-lg sm:text-xl sm:leading-6'
                style={{ color: 'white !important' }}
              >
                {title}
              </Dialog.Title>
            </div>
          )}

          {/* Content */}
          <div
            className={`${parentClass || 'p-4 sm:p-6'} ${dynamicHeight ? 'overflow-y-auto' : 'overflow-y-auto'}`}
          >
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default Modal;
