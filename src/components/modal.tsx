import React, { FunctionComponent, ReactNode, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  children: ReactNode;
  title?: ReactNode;
  dialogPanelClass?: string;
  parentClass?: string;
  preventBackdropClose?: boolean; // New prop to control backdrop closing
  size?: 'large' | 'medium' | 'small';
}

const sizeClasses = {
  small: 'max-w-sm',
  medium: 'max-w-2xl',
  large: 'max-w-6xl',
};

const Modal: FunctionComponent<ModalProps> = ({
  isOpen,
  onOpen,
  onClose,
  children,
  title = 'Modal Title' as ReactNode,
  dialogPanelClass,
  parentClass,
  preventBackdropClose = false, // Default to allow backdrop close
  size = 'medium',
}) => {
  const handleClose = () => {
    if (onClose && !preventBackdropClose) {
      onClose();
    }
  };

  // Force close function that bypasses preventBackdropClose
  const handleForceClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`${parentClass}`}>
      <Transition
        appear
        show={isOpen}
        afterEnter={() => {
          if (onOpen) {
            onOpen();
          }
        }}
        as={Fragment}
      >
        <Dialog
          as='div'
          className='relative z-50'
          onClose={handleClose}
          // Make the dialog static when preventBackdropClose is true
          static={preventBackdropClose}
        >
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black/25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel
                  className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all ${dialogPanelClass}`}
                >
                  <div className='flex items-center justify-between'>
                    <Dialog.Title
                      as='h3'
                      className='text-lg font-bold leading-6 text-gray-900'
                    >
                      {title}
                    </Dialog.Title>
                    {/* Close button that always works */}
                    <button
                      type='button'
                      className='text-gray-400 transition-colors hover:text-gray-600'
                      onClick={handleForceClose}
                    >
                      <span className='sr-only'>Close</span>
                      <svg
                        className='h-6 w-6'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                  <div className='mt-2'>{children}</div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Modal;
