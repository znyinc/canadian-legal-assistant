import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    domain?: string;
    confidence?: number;
    missingFields?: string[];
  };
}

export interface ConversationalInterfaceProps {
  kitName: string;
  initialPrompt?: string;
  onMessageSend?: (message: string) => Promise<string>;
  onContextUpdate?: (context: any) => void;
  maxMessages?: number;
  placeholder?: string;
}

/**
 * ConversationalInterface Component
 * Facilitates natural language interaction for kit workflows
 * Features: Message history, context retention, NLP-friendly responses, conversation flow management
 */
export const ConversationalInterface: React.FC<ConversationalInterfaceProps> = ({
  kitName,
  initialPrompt,
  onMessageSend,
  onContextUpdate,
  maxMessages = 50,
  placeholder = 'Type your response here...',
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      const initialMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: initialPrompt,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [initialPrompt, messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev.slice(-maxMessages + 1), userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get assistant response
      let response = 'I understand. ';
      if (onMessageSend) {
        response = await onMessageSend(input);
      } else {
        // Default response (can be overridden)
        response += 'Thank you for that information. Could you provide more details?';
      }

      // Extract confidence and context from response (if JSON-formatted)
      let contextData = context;
      try {
        const jsonMatch = response.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          contextData = { ...context, ...parsed };
          setContext(contextData);
          if (onContextUpdate) {
            onContextUpdate(contextData);
          }
        }
      } catch (e) {
        // Response is plain text
      }

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context: contextData,
      };

      setMessages((prev) => [...prev.slice(-maxMessages + 1), assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ConversationMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your response. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-maxMessages + 1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Calculate conversation progress
  const messageCount = messages.length;
  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{kitName}</h3>
          </div>
          <span className="text-xs text-gray-600">
            {userMessageCount} response{userMessageCount !== 1 ? 's' : ''} provided
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start the conversation to begin...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-xs lg:max-w-md px-4 py-3 rounded-lg
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                  }
                `}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Context Indicators */}
                {msg.context && (msg.context.confidence || msg.context.missingFields) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    {msg.context.confidence && (
                      <div>Confidence: {(msg.context.confidence * 100).toFixed(0)}%</div>
                    )}
                    {msg.context.missingFields && msg.context.missingFields.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{msg.context.missingFields.length} items needed</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="px-4 py-2 text-center text-sm text-gray-500">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Press Shift+Enter for new line, Enter to send</p>
      </div>
    </div>
  );
};
