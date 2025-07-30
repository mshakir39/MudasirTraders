import React from 'react';
import Modal from './modal';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaExclamationTriangle className="text-3xl text-red-500" />
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">{message}</p>
            {details && (
              <details className="mt-3">
                <summary className="cursor-pointer text-red-600 text-sm font-medium">
                  Show technical details
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                  {details}
                </pre>
              </details>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Troubleshooting Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
              <li>Check if your printer is connected and turned on</li>
              <li>Verify the printer drivers are installed correctly</li>
              <li>Make sure the printer is not showing any error lights</li>
              <li>Try selecting a different printer in the print dialog</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal; 