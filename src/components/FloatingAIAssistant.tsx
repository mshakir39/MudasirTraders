'use client';
import React, { useState } from 'react';
import { FaRobot } from 'react-icons/fa';

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages,
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
                <p className='text-xs text-blue-100'>
                  Powered by Step-3.5-Flash (Free)
                </p>
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
                placeholder='Ask about your business data...'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className='min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <button
                onClick={() => {
                  handleSendMessage();
                }}
                disabled={isLoading}
                className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
