'use client';

import React, { useState } from 'react';
import Modal from './modal';
import NativeDraggableModal from './NativeDraggableModal';

const ModalComparisonDemo: React.FC = () => {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Modal Comparison</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Custom Modal */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom Modal (Headless UI)</h2>
            <div className="space-y-4">
              <button
                onClick={() => setCustomModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Custom Modal
              </button>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1">
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Native HTML Dialog</h2>
            <div className="space-y-4">
              <button
                onClick={() => setNativeModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Open Native Modal
              </button>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1">
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

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Recommendation</h3>
          <p className="text-yellow-700">
            The native HTML dialog approach is simpler and more maintainable. It has built-in modal behavior, 
            better accessibility, and requires less code for drag functionality. Consider using the native approach 
            for new implementations.
          </p>
        </div>

        {/* Custom Modal */}
        <Modal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          title="Custom Modal (Headless UI)"
          size="medium"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Custom Modal Content</h3>
            <p>This modal uses the custom implementation with @headlessui/react.</p>
            <p>It has complex positioning logic and manual boundary detection.</p>
            <button
              onClick={() => setCustomModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close Custom Modal
            </button>
          </div>
        </Modal>

        {/* Native Modal */}
        <NativeDraggableModal
          isOpen={nativeModalOpen}
          onClose={() => setNativeModalOpen(false)}
          title="Native HTML Dialog"
          size="medium"
          draggable={true}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Native Modal Content</h3>
            <p>This modal uses the HTML5 &lt;dialog&gt; element.</p>
            <p>It has built-in modal behavior and simpler drag implementation.</p>
            <button
              onClick={() => setNativeModalOpen(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
