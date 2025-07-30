import React, { useState } from 'react';
import Modal from './modal';
import { BsPrinter } from 'react-icons/bs';

interface PrinterInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const PrinterInstructionsModal: React.FC<PrinterInstructionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thermal Printer Instructions"
      size="medium"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BsPrinter className="text-3xl text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Print to Thermal Printer</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Before Printing:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Make sure your Bixolon thermal printer is connected and turned on</li>
              <li>Ensure the printer has paper loaded</li>
              <li>Check that the printer is not showing any error lights</li>
            </ol>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3">In the Print Dialog:</h3>
            <ol className="list-decimal list-inside space-y-2 text-green-700">
              <li>Select your <strong>Bixolon thermal printer</strong> from the printer list</li>
              <li>Set paper size to <strong>80mm</strong> or <strong>Thermal Receipt</strong></li>
              <li>Make sure margins are set to <strong>0</strong> or <strong>Minimum</strong></li>
              <li>Click <strong>Print</strong> to start printing</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3">Troubleshooting:</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>If printer doesn't appear, check USB connection and drivers</li>
              <li>If print is too wide, select 80mm paper size</li>
              <li>If nothing prints, check printer status and paper</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
                     <button
             onClick={async () => {
               if (isPrinting) return;
               setIsPrinting(true);
               try {
                 await onConfirm();
                 onClose();
               } catch (error) {
                 console.error('Print failed:', error);
               } finally {
                 setIsPrinting(false);
               }
             }}
             disabled={isPrinting}
             className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <BsPrinter className="text-lg" />
             {isPrinting ? 'Printing...' : 'Start Printing'}
           </button>
        </div>
      </div>
    </Modal>
  );
};

export default PrinterInstructionsModal; 