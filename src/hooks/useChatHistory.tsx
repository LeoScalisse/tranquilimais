import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createConversation = useCallback(async (title?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: title || 'Nova conversa'
        })
        .select()
        .single();

      if (error) throw error;
      setConversations(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user]);

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  }, [user]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return [];

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const typedMessages = (data || []).map(m => ({
        ...m,
        role: m.role as 'user' | 'assistant'
      }));
      setMessages(typedMessages);
      return typedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addMessage = useCallback(async (
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation's updated_at
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      const typedMessage = { ...data, role: data.role as 'user' | 'assistant' };
      setMessages(prev => [...prev, typedMessage]);
      return typedMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [user]);

  return {
    conversations,
    messages,
    isLoading,
    fetchConversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    fetchMessages,
    addMessage,
    setMessages,
  };
}
