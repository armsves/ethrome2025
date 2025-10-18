'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { UserButton, useUser } from '@civic/auth-web3/react'
import type { UIMessage } from '@ai-sdk/react'
import { useState, FormEvent } from 'react'

export function Chat() {
  const { user } = useUser()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<'openai' | 'anthropic'>('openai')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: selectedModel }
    }),
    onError: (err) => {
      console.error('Chat error:', err)
      setError(err.message || 'An error occurred')
    },
  })

  const isLoading = status === 'streaming'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setError(null) // Clear previous errors
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] })
    setInput('')
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in to use AI Chat with Nexus
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your services at{' '}
            <a
              href="https://nexus.civic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              nexus.civic.com
            </a>{' '}
            and ask the AI to access them!
          </p>
          <UserButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat with Nexus</h1>
          <p className="text-gray-600 text-sm">
            Connected as {user.name || user.email}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'anthropic')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="openai">GPT-4o</option>
            <option value="anthropic">Claude Sonnet 4.5</option>
          </select>
          <UserButton />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center text-red-800">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !error && (
            <div className="text-center text-gray-500 py-12">
              <p className="mb-2">👋 Hi! I&apos;m your AI assistant with Nexus access.</p>
              <p className="text-sm">
                Try asking me to &quot;list my GitHub repos&quot; or &quot;search my Slack messages&quot;
              </p>
            </div>
          )}

          {messages.map((message: UIMessage) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="whitespace-pre-wrap">
                  {message.parts.map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.text}</span>
                    }
                    return null
                  })}
                </div>

                {/* Display tool calls */}
                {message.parts.some((p) => p.type.startsWith('tool-')) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs opacity-75">
                      🔧 Using Nexus tools...
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... (e.g., &quot;list my GitHub repos&quot;)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Tips:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Connect services at <a href="https://nexus.civic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">nexus.civic.com</a></li>
          <li>• Ask me to &quot;list my GitHub repos&quot; or &quot;search Slack messages&quot;</li>
          <li>• I can access any services you&apos;ve connected through Nexus</li>
          <li>• Tool calls are shown below AI messages</li>
        </ul>
      </div>
    </div>
  )
}
