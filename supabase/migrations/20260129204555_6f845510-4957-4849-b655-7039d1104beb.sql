-- Add checkin_data column to store the new mood check-in data
ALTER TABLE public.moods 
ADD COLUMN checkin_data jsonb DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.moods.checkin_data IS 'Stores structured check-in data: emotions, intensity, influencer, customInfluencer';