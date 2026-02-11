import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, Upload, AlertCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'system' | 'user' | 'assistant';
  content: string;
  followUps?: string[];
  confidence?: number;
}

interface ConversationalIntakeProps {
  onComplete: (matterData: {
    description: string;
    domain?: string;
    jurisdiction?: string;
    urgency?: string;
    evidenceFiles?: File[];
  }) => void;
  onCancel: () => void;
}

export const ConversationalIntake: React.FC<ConversationalIntakeProps> = ({
  onComplete,
  onCancel,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'system',
      content: "I'm here to help you understand your legal situation. Tell me what's happening — take your time, just describe what you're dealing with.",
      followUps: undefined,
    },
  ]);

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentClassification, setCurrentClassification] = useState<{
    domain?: string;
    jurisdiction?: string;
    urgency?: string;
    confidence?: number;
  }>({});
  const [stage, setStage] = useState<'initial' | 'followup' | 'complete'>('initial');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() && uploadedFiles.length === 0) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Simulate API call to IntakeAgent
      // In production, this calls backend IntakeAgent methods
      const response = await fetch('/api/intake/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          conversationHistory: messages,
          uploadedFileNames: uploadedFiles.map((f) => f.name),
        }),
      });

      if (!response.ok) throw new Error('Failed to process input');

      const data = await response.json();

      // Update classification
      if (data.classification) {
        setCurrentClassification(data.classification);
      }

      // Determine if we need more follow-ups
      if (data.confidence && data.confidence >= 75) {
        // High confidence - ready to complete
        setStage('complete');
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Great. I understand your situation: you're dealing with a ${data.classification?.domain} matter in ${data.classification?.jurisdiction}. I'll gather what you've shared and show you the options available.`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Need clarification
        const followUps = data.followUpQuestions || [];
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Got it. Just a few quick clarifications to make sure I understand correctly.',
          followUps,
          confidence: data.confidence,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStage('followup');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `I had trouble processing that. Could you try phrasing it differently? ${error instanceof Error ? error.message : ''}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, messages, uploadedFiles]);

  const handleFollowUpSelect = (followUp: string) => {
    setUserInput(followUp);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleComplete = () => {
    const fullDescription = messages
      .filter((m) => m.type === 'user')
      .map((m) => m.content)
      .join('\n\n');

    onComplete({
      description: fullDescription,
      domain: currentClassification.domain,
      jurisdiction: currentClassification.jurisdiction,
      urgency: currentClassification.urgency,
      evidenceFiles: uploadedFiles,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Let's start with what's happening</h2>
        <p className="text-sm text-gray-600 mt-1">
          {stage === 'initial' && 'Tell me your situation in your own words'}
          {stage === 'followup' && 'Help me understand a bit more'}
          {stage === 'complete' && 'Ready to explore your options'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'system' || message.type === 'assistant' ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-gray-800 text-sm leading-relaxed">{message.content}</p>
                    {message.confidence && message.confidence < 100 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${message.confidence}%` }}
                          />
                        </div>
                        <span>{Math.round(message.confidence || 0)}% confident</span>
                      </div>
                    )}
                  </div>
                  {message.followUps && message.followUps.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.followUps.map((followUp, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleFollowUpSelect(followUp)}
                          className="block w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-sm text-gray-700"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-4 max-w-xs">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Classification status */}
      {currentClassification.domain && (
        <div className="border-t px-6 py-3 bg-green-50 border-green-200">
          <p className="text-xs font-medium text-green-800">
            {currentClassification.domain} {currentClassification.jurisdiction && `• ${currentClassification.jurisdiction}`}
            {currentClassification.urgency && ` • ${currentClassification.urgency}`}
          </p>
        </div>
      )}

      {/* File uploads */}
      <div className="border-t px-6 py-4 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <Upload className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">Add evidence (photos, documents)</span>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf"
            className="hidden"
          />
        </label>
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                <span className="text-gray-700">{file.name}</span>
                <button
                  onClick={() => handleFileRemove(file.name)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-6 py-4 bg-white">
        {stage !== 'complete' ? (
          <div className="space-y-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response or select one of the options above..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!userInput.trim() && uploadedFiles.length === 0)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Ready to proceed</p>
                <p className="text-sm text-green-800 mt-1">
                  I understand your situation. Let's explore what options are available to you.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                See my options
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setStage('followup');
                  setUserInput('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add more details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationalIntake;
