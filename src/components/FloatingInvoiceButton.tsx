'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { 
  invoiceCreationStatesAtom, 
  restoreInvoiceCreationStateAtom,
  deleteInvoiceCreationStateAtom,
  clearAllInvoiceCreationStatesAtom,
  startNewInvoiceCreationAtom
} from '@/store/sharedAtoms';
import { Plus, X, FileText, Trash2, Clock } from 'lucide-react';

interface FloatingInvoiceButtonProps {
  className?: string;
}

export const FloatingInvoiceButton: React.FC<FloatingInvoiceButtonProps> = ({ className = '' }) => {
  const [invoiceStates] = useAtom(invoiceCreationStatesAtom);
  const [, restoreState] = useAtom(restoreInvoiceCreationStateAtom);
  const [, deleteState] = useAtom(deleteInvoiceCreationStateAtom);
  const [, clearAllStates] = useAtom(clearAllInvoiceCreationStatesAtom);
  const [, startNew] = useAtom(startNewInvoiceCreationAtom);

  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleRestore = (id: string) => {
    restoreState(id);
    setShowDropdown(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteState(id);
  };

  const handleNewInvoice = () => {
    startNew();
    setShowDropdown(false);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllStates();
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (invoiceStates.length === 0) {
    return null; // Don't show anything when no saved states
  }

  return (
    <div className={`fixed bottom-24 right-6 z-50 ${className}`}> {/* Changed from bottom-6 to bottom-24 */}
      <div className="relative" ref={dropdownRef}>
        {/* Main button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 relative"
          title={`Saved Invoices (${invoiceStates.length})`}
        >
          <FileText size={20} />
          {invoiceStates.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {invoiceStates.length}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Saved Invoices</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    title="Clear all saved invoices"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {invoiceStates.map((state) => (
                <div
                  key={state.id}
                  className="p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer group"
                  onClick={() => handleRestore(state.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={14} className="text-blue-500" />
                        <span className="font-medium text-gray-900 truncate">
                          {state.customerName || 'Unnamed Customer'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {state.products?.length || 0} products • Rs {state.totalAmount?.toLocaleString() || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatTime(state.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(state.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            </div>
        )}
      </div>
    </div>
  );
};
