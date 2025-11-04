'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Brain, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ModelType = 'openai' | 'ollama'

export default function CoachingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI coach. I have access to your training data including activities, distances, pace, and planned workouts. How can I help you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<ModelType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ai-model-preference') as ModelType) || 'openai'
    }
    return 'openai'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-model-preference', newModel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/coaching/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessage.content,
          model: model,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }))
        throw new Error(errorData.error || 'Failed to get response from AI coach')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }
              
              // Handle function call events - update status message
              if (data.type === 'function_call') {
                let statusMessage = 'Thinking...'
                if (data.status === 'executing') {
                  statusMessage = 'Querying database...'
                } else if (data.status === 'initiated') {
                  statusMessage = 'Preparing query...'
                }
                
                // Update the assistant message with status
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: statusMessage }
                      : msg
                  )
                )
              }
              
              // Handle query results - update status message
              if (data.type === 'query_result') {
                const resultCount = data.result.count || 0
                const statusMessage = resultCount > 0 
                  ? `Found ${resultCount} ${resultCount === 1 ? 'activity' : 'activities'}. Analyzing...`
                  : 'No results found. Analyzing...'
                
                // Update the assistant message with status
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: statusMessage }
                      : msg
                  )
                )
              }
              
              if (data.chunk) {
                fullResponse += data.chunk
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullResponse }
                      : msg
                  )
                )
              }
              
              if (data.done) {
                setIsLoading(false)
                return
              }
            } catch (e) {
              // Skip invalid JSON
              continue
            }
          }
        }
      }

      setIsLoading(false)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
      
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-slate-900">AI Coach</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Model:</label>
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value as ModelType)}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="openai">OpenAI GPT-4o-mini</option>
              <option value="ollama">Ollama Llama 3.2</option>
            </select>
          </div>
        </div>
        <p className="text-slate-600">Chat with your personal training coach</p>
      </div>

      {/* Status Notice
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 mb-4">
        <div className="p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-600">
              <p className="font-medium text-slate-900 mb-1">Powered by OpenAI GPT-4o-mini</p>
              <p>
                I have access to your training data including activities, distances, pace, and planned workouts.
              </p>
            </div>
          </div>
        </div>
      </Card> */}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden mb-4 max-w-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-w-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 min-w-0 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] min-w-0 rounded-lg px-4 py-3 break-words ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-slate prose-sm max-w-full w-full break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}>
                    {message.content ? (
                      // Check if this is a status message (not a full response)
                      message.content === 'Thinking...' || 
                      message.content === 'Preparing query...' || 
                      message.content === 'Querying database...' || 
                      (message.content.startsWith('Found ') && message.content.includes('Analyzing...')) ||
                      message.content === 'No results found. Analyzing...' ? (
                        <span className="text-slate-400 italic flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {message.content}
                        </span>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                          p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
                          code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => {
                            const isInline = !className
                            return isInline ? (
                              <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }} {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-slate-200 text-slate-800 p-3 rounded text-xs font-mono overflow-x-auto mb-2 w-full max-w-full" style={{ wordBreak: 'break-all', boxSizing: 'border-box' }} {...props}>
                                {children}
                              </code>
                            )
                          },
                          pre: ({ children }: { children?: React.ReactNode }) => (
                            <pre className="bg-slate-200 text-slate-800 p-3 rounded text-xs font-mono overflow-x-auto mb-2 w-full max-w-full" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', boxSizing: 'border-box' }}>
                              {children}
                            </pre>
                          ),
                          h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                          h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                          blockquote: ({ children }: { children?: React.ReactNode }) => (
                            <blockquote className="border-l-4 border-slate-300 pl-3 italic my-2">
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          table: ({ children }: { children?: React.ReactNode }) => (
                            <div className="overflow-x-auto my-2 max-w-full">
                              <table className="border-collapse text-xs w-full table-auto">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-slate-200">{children}</thead>,
                          tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
                          tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-slate-300">{children}</tr>,
                          th: ({ children }: { children?: React.ReactNode }) => <th className="px-2 py-1 text-left font-semibold break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</th>,
                          td: ({ children }: { children?: React.ReactNode }) => <td className="px-2 py-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</td>,
                          hr: () => <hr className="my-3 border-slate-300" />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      )
                    ) : (
                      <span className="text-slate-400 italic flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Thinking...
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {message.content}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-[80%]">
                <p className="text-sm text-red-800 font-medium mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your coach anything about your training..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="default"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  )
}
