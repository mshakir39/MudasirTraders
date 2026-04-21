'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { FaRobot } from 'react-icons/fa';
import {
  categoriesAtom,
  stockAtom,
  brandsAtom,
  invoicesAtom,
  fetchCategoriesAtom,
  fetchStockAtom,
  fetchBrandsAtom,
  fetchInvoicesAtom,
} from '@/store/sharedAtoms';

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Read store data
  const [categories] = useAtom(categoriesAtom);
  const [stock] = useAtom(stockAtom);
  const [brands] = useAtom(brandsAtom);
  const [invoices] = useAtom(invoicesAtom);

  // Fetch actions
  const fetchCategories = useSetAtom(fetchCategoriesAtom);
  const fetchStock = useSetAtom(fetchStockAtom);
  const fetchBrands = useSetAtom(fetchBrandsAtom);
  const fetchInvoices = useSetAtom(fetchInvoicesAtom);

  // Fetch data when AI assistant opens and data is missing
  useEffect(() => {
    if (!isOpen) return;

    const hasData =
      categories.length > 0 ||
      stock.length > 0 ||
      brands.length > 0 ||
      invoices.length > 0;
    if (hasData) {
      console.log('✅ AI Assistant: Data already available');
      return;
    }

    console.log('🔄 AI Assistant: Fetching data...');
    setDataLoading(true);
    Promise.all([
      fetchCategories(),
      fetchStock(),
      fetchBrands(),
      fetchInvoices(),
    ])
      .then(() => {
        console.log('✅ AI Assistant: Data fetched successfully');
        setDataLoading(false);
      })
      .catch((err) => {
        console.error('❌ AI Assistant: Failed to fetch data', err);
        setDataLoading(false);
      });
  }, [
    isOpen,
    categories.length,
    stock.length,
    brands.length,
    invoices.length,
    fetchCategories,
    fetchStock,
    fetchBrands,
    fetchInvoices,
  ]);

  // Build compact store summary (only when data changes)
  const storeData = useMemo(() => {
    const summary: any = {};

    if (categories.length > 0) {
      summary.categories = categories
        .map((c: any) => c.name || c.categoryName || c._id)
        .filter(Boolean);
    }

    if (brands.length > 0) {
      summary.brands = brands
        .map((b: any) => b.name || b.brandName || b._id)
        .filter(Boolean);
    }

    if (stock.length > 0) {
      summary.stockSummary = {
        totalProducts: stock.length,
        items: stock.slice(0, 50).map((s: any) => ({
          name: s.name || s.productName || '',
          brand: s.brand || s.brandName || '',
          qty: s.quantity ?? s.currentStock ?? s.stock ?? 0,
          price: s.salePrice ?? s.price ?? 0,
        })),
      };
    }

    if (invoices.length > 0) {
      const totalRevenue = invoices.reduce(
        (sum: number, inv: any) => sum + (inv.totalAmount || 0),
        0
      );
      const totalReceived = invoices.reduce(
        (sum: number, inv: any) => sum + (inv.receivedAmount || 0),
        0
      );
      const totalPending = invoices.reduce(
        (sum: number, inv: any) => sum + (inv.remainingAmount || 0),
        0
      );
      summary.invoiceSummary = {
        totalInvoices: invoices.length,
        totalRevenue,
        totalReceived,
        totalPending,
        recentInvoices: invoices.slice(0, 10).map((inv: any) => ({
          no: inv.invoiceNo,
          customer: inv.customerName,
          total: inv.totalAmount,
          received: inv.receivedAmount,
          remaining: inv.remainingAmount,
          status: inv.paymentStatus,
          date: inv.createdDate,
        })),
      };
    }

    const result = Object.keys(summary).length > 0 ? summary : undefined;
    if (result) {
      console.log('📦 FloatingAIAssistant: storeData built with', {
        categories: result.categories?.length || 0,
        brands: result.brands?.length || 0,
        stockItems: result.stockSummary?.items?.length || 0,
        invoices: result.invoiceSummary?.totalInvoices || 0,
      });
    } else {
      console.log(
        '⚠️ FloatingAIAssistant: storeData is empty - waiting for GlobalDataProvider'
      );
    }
    return result;
  }, [categories, brands, stock, invoices]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Debug: Check if storeData is available
    if (!storeData) {
      console.warn('⚠️ Sending message without storeData - AI will be slower');
    }

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages,
          storeData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || 'Sorry, I could not process your request.',
        },
      ]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div
        className='fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300'
        onClick={() => setIsOpen(true)}
        title='AI Assistant'
      >
        <FaRobot className='text-xl' />
        <span className='absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-400' />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-24 right-6 z-50 w-72 max-w-[75vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between bg-blue-600 p-4 text-white'>
            <div className='flex items-center gap-3'>
              <FaRobot className='text-xl' />
              <div>
                <h3 className='font-semibold'>AI Assistant</h3>
                <p className='text-xs text-blue-100'>Powered by AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='rounded-full p-1 transition-colors hover:bg-blue-700'
              title='Close'
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className='h-96 overflow-y-auto overflow-x-hidden bg-gray-50 p-4'>
            {messages.length === 0 ? (
              <div className='py-8 text-center'>
                <FaRobot className='mx-auto mb-3 text-4xl text-gray-300' />
                <h4 className='mb-2 font-semibold text-gray-700'>
                  Welcome to AI Assistant
                </h4>
                <p className='mb-4 text-sm text-gray-500'>
                  Ask me anything about your business data!
                </p>
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-gray-600'>
                    Try asking:
                  </p>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => {
                        setInput('What is our total revenue?');
                      }}
                      className='rounded-lg border border-gray-200 bg-white px-2 py-1 text-left text-xs transition-colors hover:bg-gray-50'
                    >
                      What is our total revenue?
                    </button>
                    <button
                      onClick={() => {
                        setInput('How many batteries in stock?');
                      }}
                      className='rounded-lg border border-gray-200 bg-white px-2 py-1 text-left text-xs transition-colors hover:bg-gray-50'
                    >
                      How many batteries in stock?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='space-y-3 overflow-x-hidden'>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} overflow-x-hidden`}
                  >
                    <div
                      className={`max-w-[70%] overflow-hidden break-words rounded-lg px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='flex justify-start overflow-x-hidden'>
                    <div className='max-w-[70%] overflow-hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500'>
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className='overflow-x-hidden border-t border-gray-200 bg-white p-4'>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                placeholder={
                  dataLoading
                    ? 'Loading data...'
                    : 'Ask about your business data...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading || dataLoading}
                className='min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100'
              />
              <button
                onClick={() => {
                  handleSendMessage();
                }}
                disabled={isLoading || dataLoading || !input.trim()}
                className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {dataLoading
                  ? 'Loading...'
                  : isLoading
                    ? 'Thinking...'
                    : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
