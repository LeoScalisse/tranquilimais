import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { playSound } from '../services/soundService';
import { SendIcon, CopyIcon, CheckIcon, ImageIcon, SearchIcon, SparklesIcon } from '../components/ui/Icons';
import BrandText from '../components/BrandText';

interface ChatScreenProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ chatHistory, onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyToClipboard = (text: string, messageId: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      playSound('confirm');
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    playSound('send');
    onSendMessage(inputValue);
    setInputValue('');
  };

  const quickActions = [
    { icon: <SearchIcon className="w-4 h-4" />, label: 'Pesquisar', prefix: '[Search: ' },
    { icon: <SparklesIcon className="w-4 h-4" />, label: 'Pensar', prefix: '[Think: ' },
    { icon: <ImageIcon className="w-4 h-4" />, label: 'Criar', prefix: '[Canvas: ' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-tranquili-blue to-blue-400 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h1 className="font-bold text-lg">Tranquilinha</h1>
            <p className="text-xs text-white/80">Sua assistente de bem-estar</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <span className="text-6xl block mb-4">💬</span>
            <p className="font-medium">Olá! Sou a Tranquilinha.</p>
            <p className="text-sm">Como posso te ajudar hoje?</p>
          </div>
        ) : (
          chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-tranquili-blue text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attached"
                    className="rounded-lg mb-2 max-h-48 object-cover"
                  />
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  <BrandText text={message.text} />
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {message.role === 'model' && (
                    <button
                      onClick={() => handleCopyToClipboard(message.text, message.id)}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {copiedMessageId === message.id ? (
                        <CheckIcon className="w-3 h-3 text-green-500" />
                      ) : (
                        <CopyIcon className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4 rounded-bl-md">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="absolute bottom-24 left-0 right-0 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                playSound('select');
                setInputValue(action.prefix);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap shadow-sm"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-tranquili-blue outline-none text-gray-800"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isLoading
                ? 'bg-tranquili-blue text-white hover:bg-blue-500'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
