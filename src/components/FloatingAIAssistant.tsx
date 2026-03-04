'use client';
import React, { useState } from 'react';
import { FaRobot } from 'react-icons/fa';

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called, input:', input);
    if (!input.trim()) {
      console.log('Empty input, returning');
      return;
    }

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending API request...');
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
      console.log('API response:', data);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.'
      }]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
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
        <span className='absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-pulse' />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-24 right-6 z-50 w-72 max-w-[75vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between bg-blue-600 text-white p-4'>
            <div className='flex items-center gap-3'>
              <FaRobot className='text-xl' />
              <div>
                <h3 className='font-semibold'>AI Assistant</h3>
                <p className='text-xs text-blue-100'>Powered by Step-3.5-Flash (Free)</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='rounded-full p-1 hover:bg-blue-700 transition-colors'
              title='Close'
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className='h-96 overflow-y-auto overflow-x-hidden p-4 bg-gray-50'>
            {messages.length === 0 ? (
              <div className='text-center py-8'>
                <FaRobot className='text-4xl text-gray-300 mx-auto mb-3' />
                <h4 className='font-semibold text-gray-700 mb-2'>
                  Welcome to AI Assistant
                </h4>
                <p className='text-sm text-gray-500 mb-4'>
                  Ask me anything about your business data!
                </p>
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-gray-600'>Try asking:</p>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => {
                        setInput('What is our total revenue?');
                      }}
                      className='text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors'
                    >
                      What is our total revenue?
                    </button>
                    <button
                      onClick={() => {
                        setInput('How many batteries in stock?');
                      }}
                      className='text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors'
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
                      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm break-words overflow-hidden ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='flex justify-start overflow-x-hidden'>
                    <div className='bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-500 max-w-[70%] overflow-hidden'>
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className='p-4 bg-white border-t border-gray-200 overflow-x-hidden'>
            <div className='flex gap-2 items-center'>
              <input
                type='text'
                placeholder='Ask about your business data...'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Enter key pressed, sending message...');
                    handleSendMessage();
                  }
                }}
                className='flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <button
                onClick={() => {
                  console.log('Send button clicked');
                  handleSendMessage();
                }}
                disabled={isLoading}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
