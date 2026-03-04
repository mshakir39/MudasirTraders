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
      timestamp: new Date().toLocaleTimeString('en-PK')
    };

    setMessages(prev => [...prev, userMessage]);
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
          timestamp: new Date().toLocaleTimeString('en-PK')
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          type: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString('en-PK')
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        type: 'assistant',
        content: 'Network error. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-PK')
      };

      setMessages(prev => [...prev, errorMessage]);
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
    'How many active dealers do we have?'
  ];

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Sidebar */}
      <div className='w-80 bg-white border-r border-gray-200 p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <FaRobot className='text-2xl text-blue-600' />
          <h1 className='text-xl font-bold text-gray-900'>AI Assistant</h1>
        </div>

        <div className='mb-6'>
          <h3 className='text-sm font-semibold text-gray-700 mb-3'>
            Suggested Questions
          </h3>
          <div className='space-y-2'>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className='w-full text-left px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors'
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
      <div className='flex-1 flex flex-col'>
        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {messages.length === 0 && (
            <div className='text-center py-12'>
              <FaRobot className='text-6xl text-gray-300 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-700 mb-2'>
                Welcome to AI Assistant
              </h2>
              <p className='text-gray-500'>
                Ask me anything about your business data - dashboard, stock, dealers, sales, and more!
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
             <div className='text-sm prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600'>
  {message.type === 'assistant' ? (
    <ReactMarkdown
      components={{
        // Custom components for better rendering
        p: ({children}) => <p className="mb-2">{children}</p>,
        ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
        ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
        li: ({children}) => <li className="mb-1">{children}</li>,
        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
        code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>,
        pre: ({children}) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-sm">{children}</pre>,
      }}
    >
      {message.content}
    </ReactMarkdown>
  ) : (
    <span>{message.content}</span>
  )}
</div>
                <div
                  className={`text-xs mt-2 ${
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
              <div className='bg-white border border-gray-200 px-4 py-3 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <FaSpinner className='animate-spin text-blue-600' />
                  <span className='text-sm text-gray-600'>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className='border-t border-gray-200 p-4 bg-white'>
          <form onSubmit={handleSubmit} className='flex gap-3'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask about your business data...'
              className='flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={isLoading}
            />
            <button
              type='submit'
              disabled={isLoading || !input.trim()}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
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
