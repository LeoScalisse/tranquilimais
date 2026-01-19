-- =============================================
-- TABELA: Conversas do Chatbot Tranquilinha
-- =============================================
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mensagens das conversas
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Diário de Gratidão
-- =============================================
CREATE TABLE public.gratitude_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    mood_emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Recordes de Games
-- =============================================
CREATE TABLE public.game_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER,
    time_seconds INTEGER,
    metadata JSONB,
    achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, game_id)
);

-- =============================================
-- TABELA: Notícias Salvas/Favoritas
-- =============================================
CREATE TABLE public.saved_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    source TEXT,
    category TEXT,
    saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, url)
);

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: Chat Conversations
-- =============================================
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.chat_conversations FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: Chat Messages
-- =============================================
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: Gratitude Entries
-- =============================================
CREATE POLICY "Users can view their own gratitude entries"
ON public.gratitude_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gratitude entries"
ON public.gratitude_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gratitude entries"
ON public.gratitude_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gratitude entries"
ON public.gratitude_entries FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: Game Records
-- =============================================
CREATE POLICY "Users can view their own game records"
ON public.game_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game records"
ON public.game_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game records"
ON public.game_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game records"
ON public.game_records FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: Saved News
-- =============================================
CREATE POLICY "Users can view their own saved news"
ON public.saved_news FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save news"
ON public.saved_news FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved news"
ON public.saved_news FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gratitude_entries_updated_at
BEFORE UPDATE ON public.gratitude_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_gratitude_entries_user_id ON public.gratitude_entries(user_id);
CREATE INDEX idx_gratitude_entries_created_at ON public.gratitude_entries(created_at DESC);
CREATE INDEX idx_game_records_user_id ON public.game_records(user_id);
CREATE INDEX idx_game_records_game_id ON public.game_records(game_id);
CREATE INDEX idx_saved_news_user_id ON public.saved_news(user_id);
CREATE INDEX idx_saved_news_saved_at ON public.saved_news(saved_at DESC);