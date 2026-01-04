-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements" 
ON public.achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" 
ON public.achievements 
FOR DELETE 
USING (auth.uid() = user_id);