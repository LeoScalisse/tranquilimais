
-- Create habit_definitions table
CREATE TABLE public.habit_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own habit definitions" ON public.habit_definitions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habit definitions" ON public.habit_definitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habit definitions" ON public.habit_definitions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit definitions" ON public.habit_definitions FOR DELETE USING (auth.uid() = user_id);

-- Add FK column to habits table
ALTER TABLE public.habits ADD COLUMN habit_definition_id UUID REFERENCES public.habit_definitions(id) ON DELETE CASCADE;
