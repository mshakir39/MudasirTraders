'use client';

import React, { useState } from 'react';
import Modal from './modal';
import NativeDraggableModal from './NativeDraggableModal';

const ModalComparisonDemo: React.FC = () => {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='mx-auto max-w-6xl'>
        <h1 className='mb-8 text-3xl font-bold text-gray-900'>
          Modal Comparison
        </h1>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Custom Modal */}
          <div className='rounded-lg bg-white p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-semibold text-gray-800'>
              Custom Modal (Headless UI)
            </h2>
            <div className='space-y-4'>
              <button
                onClick={() => setCustomModalOpen(true)}
                className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
              >
                Open Custom Modal
              </button>

              <div className='text-sm text-gray-600'>
                <p className='mb-2 font-medium'>Features:</p>
                <ul className='list-inside list-disc space-y-1'>
                  <li>Uses @headlessui/react Dialog</li>
                  <li>Complex positioning logic</li>
                  <li>Manual boundary detection</li>
                  <li>More control over behavior</li>
                  <li>Heavier implementation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Native Modal */}
          <div className='rounded-lg bg-white p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-semibold text-gray-800'>
              Native HTML Dialog
            </h2>
            <div className='space-y-4'>
              <button
                onClick={() => setNativeModalOpen(true)}
                className='rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
              >
                Open Native Modal
              </button>

              <div className='text-sm text-gray-600'>
                <p className='mb-2 font-medium'>Features:</p>
                <ul className='list-inside list-disc space-y-1'>
                  <li>Uses HTML5 &lt;dialog&gt; element</li>
                  <li>Built-in modal behavior</li>
                  <li>Simpler drag implementation</li>
                  <li>Better accessibility</li>
                  <li>Lighter code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
          <h3 className='mb-2 text-lg font-semibold text-yellow-800'>
            💡 Recommendation
          </h3>
          <p className='text-yellow-700'>
            The native HTML dialog approach is simpler and more maintainable. It
            has built-in modal behavior, better accessibility, and requires less
            code for drag functionality. Consider using the native approach for
            new implementations.
          </p>
        </div>

        {/* Custom Modal */}
        <Modal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          title='Custom Modal (Headless UI)'
          size='medium'
        >
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Custom Modal Content</h3>
            <p>
              This modal uses the custom implementation with @headlessui/react.
            </p>
            <p>
              It has complex positioning logic and manual boundary detection.
            </p>
            <button
              onClick={() => setCustomModalOpen(false)}
              className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Close Custom Modal
            </button>
          </div>
        </Modal>

        {/* Native Modal */}
        <NativeDraggableModal
          isOpen={nativeModalOpen}
          onClose={() => setNativeModalOpen(false)}
          title='Native HTML Dialog'
          size='medium'
          draggable={true}
        >
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Native Modal Content</h3>
            <p>This modal uses the HTML5 &lt;dialog&gt; element.</p>
            <p>
              It has built-in modal behavior and simpler drag implementation.
            </p>
            <button
              onClick={() => setNativeModalOpen(false)}
              className='rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700'
            >
              Close Native Modal
            </button>
          </div>
        </NativeDraggableModal>
      </div>
    </div>
  );
};

export default ModalComparisonDemo;
