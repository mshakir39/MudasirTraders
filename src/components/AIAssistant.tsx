'use client';
import React, { useState } from 'react';
import { FaRobot, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-PK'),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          type: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString('en-PK'),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          type: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString('en-PK'),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        type: 'assistant',
        content: 'Network error. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-PK'),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What is our total revenue?',
    'How many batteries are in stock?',
    'Which dealers have outstanding payments?',
    'What are our top selling brands?',
    'Show me recent sales today',
    'What is the total pending amount?',
    'Which batteries are low in stock?',
    'How many active dealers do we have?',
  ];

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Sidebar */}
      <div className='w-80 border-r border-gray-200 bg-white p-6'>
        <div className='mb-6 flex items-center gap-3'>
          <FaRobot className='text-2xl text-blue-600' />
          <h1 className='text-xl font-bold text-gray-900'>AI Assistant</h1>
        </div>

        <div className='mb-6'>
          <h3 className='mb-3 text-sm font-semibold text-gray-700'>
            Suggested Questions
          </h3>
          <div className='space-y-2'>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className='w-full rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <p className='mb-2'>
            <strong>What I can help with:</strong>
          </p>
          <ul className='space-y-1'>
            <li>• Dashboard statistics</li>
            <li>• Stock & inventory</li>
            <li>• Dealer information</li>
            <li>• Sales & payments</li>
            <li>• Categories & brands</li>
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex flex-1 flex-col'>
        {/* Messages */}
        <div className='flex-1 space-y-4 overflow-y-auto p-6'>
          {messages.length === 0 && (
            <div className='py-12 text-center'>
              <FaRobot className='mx-auto mb-4 text-6xl text-gray-300' />
              <h2 className='mb-2 text-xl font-semibold text-gray-700'>
                Welcome to AI Assistant
              </h2>
              <p className='text-gray-500'>
                Ask me anything about your business data - dashboard, stock,
                dealers, sales, and more!
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-900'
                }`}
              >
                <div className='prose prose-sm prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 max-w-none text-sm'>
                  {message.type === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        // Custom components for better rendering
                        p: ({ children }) => <p className='mb-2'>{children}</p>,
                        ul: ({ children }) => (
                          <ul className='mb-2 list-disc pl-4'>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className='mb-2 list-decimal pl-4'>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className='mb-1'>{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className='font-semibold'>{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className='rounded bg-gray-100 px-1 py-0.5 text-sm'>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className='overflow-x-auto rounded bg-gray-100 p-2 text-sm'>
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <span>{message.content}</span>
                  )}
                </div>
                <div
                  className={`mt-2 text-xs ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className='flex justify-start'>
              <div className='rounded-lg border border-gray-200 bg-white px-4 py-3'>
                <div className='flex items-center gap-2'>
                  <FaSpinner className='animate-spin text-blue-600' />
                  <span className='text-sm text-gray-600'>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className='border-t border-gray-200 bg-white p-4'>
          <form onSubmit={handleSubmit} className='flex gap-3'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask about your business data...'
              className='flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={isLoading}
            />
            <button
              type='submit'
              disabled={isLoading || !input.trim()}
              className='flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              {isLoading ? (
                <FaSpinner className='animate-spin' />
              ) : (
                <FaPaperPlane />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
