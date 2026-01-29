import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { playSound } from '../services/soundService';
import { SendIcon, CopyIcon, CheckIcon, ImageIcon, SearchIcon, SparklesIcon, MessageSquareIcon, PlusIcon, TrashIcon } from '../components/ui/Icons';
import BrandText from '../components/BrandText';
import TranquilinhaAvatar from '@/assets/TranquilinhaAvatar.png';
import { useChatHistory, ChatConversation, ChatMessage } from '@/hooks/useChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatScreenProps {
  chatHistory: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ chatHistory, onSendMessage, isLoading }) => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    isLoading: isHistoryLoading,
    fetchConversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    fetchMessages,
    addMessage,
    setMessages,
  } = useChatHistory();

  const [inputValue, setInputValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [displayMessages, setDisplayMessages] = useState<Array<{
    id: string;
    role: 'user' | 'model' | 'assistant';
    text: string;
    timestamp: number;
    image?: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Combine local chatHistory with DB messages
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const dbMessages = messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'model' | 'assistant',
        text: m.content,
        timestamp: new Date(m.created_at).getTime(),
      }));
      setDisplayMessages(dbMessages);
    } else {
      setDisplayMessages(chatHistory.map(m => ({
        ...m,
        role: m.role as 'user' | 'model' | 'assistant',
      })));
    }
  }, [chatHistory, messages, currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyToClipboard = (text: string, messageId: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      playSound('confirm');
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    playSound('send');
    
    // If user is logged in, save to DB
    if (user) {
      let convId = currentConversationId;
      
      // Create new conversation if needed (fallback for when user starts chatting without clicking "Nova conversa")
      if (!convId) {
        const conv = await createConversation(inputValue.slice(0, 50) + '...');
        if (conv) {
          convId = conv.id;
          setCurrentConversationId(conv.id);
        }
      } else {
        // Update conversation title with first message if it's still "Nova conversa"
        const currentConv = conversations.find(c => c.id === convId);
        if (currentConv && currentConv.title === 'Nova conversa') {
          await updateConversationTitle(convId, inputValue.slice(0, 50) + '...');
        }
      }

      if (convId) {
        await addMessage(convId, 'user', inputValue);
      }
    }
    
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleNewConversation = async () => {
    // Immediately clear UI state for instant feedback
    setDisplayMessages([]);
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
    
    // Create new conversation in background if user is logged in
    if (user) {
      const conv = await createConversation('Nova conversa');
      if (conv) {
        setCurrentConversationId(conv.id);
      }
    }
  };

  const handleLoadConversation = async (conv: ChatConversation) => {
    setCurrentConversationId(conv.id);
    await fetchMessages(conv.id);
    setShowHistory(false);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(convId);
    if (currentConversationId === convId) {
      handleNewConversation();
    }
  };

  const quickActions = [
    { icon: <SearchIcon className="w-4 h-4" />, label: 'Pesquisar', prefix: '[Search: ' },
    { icon: <SparklesIcon className="w-4 h-4" />, label: 'Pensar', prefix: '[Think: ' },
    { icon: <ImageIcon className="w-4 h-4" />, label: 'Criar', prefix: '[Canvas: ' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-tranquili-blue to-blue-400 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <img src={TranquilinhaAvatar} alt="Tranquilinha" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Tranquilinha</h1>
              <p className="text-xs text-white/80">Sua assistente de bem-estar</p>
            </div>
          </div>
          
          {/* History Button */}
          {user && (
            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <MessageSquareIcon className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <span>Conversas</span>
                    <Button size="sm" onClick={handleNewConversation}>
                      <PlusIcon className="w-4 h-4 mr-1" /> Nova
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-150px)]">
                  {isHistoryLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquareIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma conversa ainda</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {conversations.map((conv) => (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onClick={() => handleLoadConversation(conv)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            currentConversationId === conv.id
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-card border border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {conv.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(conv.updated_at)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {displayMessages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <span className="text-6xl block mb-4">💬</span>
            <p className="font-medium">Olá! Sou a Tranquilinha.</p>
            <p className="text-sm">Como posso te ajudar hoje?</p>
          </div>
        ) : (
          displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-tranquili-blue text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
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
                  <span className={`text-[10px] ${message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {(message.role === 'model' || message.role === 'assistant') && (
                    <button
                      onClick={() => handleCopyToClipboard(message.text, message.id)}
                      className="p-1 rounded-full hover:bg-muted-foreground/20 transition-colors"
                    >
                      {copiedMessageId === message.id ? (
                        <CheckIcon className="w-3 h-3 text-green-500" />
                      ) : (
                        <CopyIcon className="w-3 h-3 text-muted-foreground" />
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
            <div className="bg-muted rounded-2xl p-4 rounded-bl-md">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:bg-muted whitespace-nowrap shadow-sm"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
            disabled={isLoading}
            autoComplete="off"
            autoCorrect="on"
            enterKeyHint="send"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
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
