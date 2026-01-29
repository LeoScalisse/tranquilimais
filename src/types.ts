export type Mood = 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious';

// New mood check-in types
export type CheckinEmotion = 
  | 'calmo' 
  | 'ansioso' 
  | 'triste' 
  | 'cansado' 
  | 'sobrecarregado' 
  | 'grato' 
  | 'motivado' 
  | 'confuso' 
  | 'esperancoso' 
  | 'vazio';

export type CheckinIntensity = 'leve' | 'moderado' | 'intenso';

export type CheckinInfluencer = 
  | 'corpo' 
  | 'pensamentos' 
  | 'pessoas' 
  | 'trabalho' 
  | 'redes_sociais' 
  | 'nada_especifico'
  | 'custom';

export interface MoodCheckinData {
  emotions: CheckinEmotion[];
  intensity?: CheckinIntensity;
  influencer?: CheckinInfluencer;
  customInfluencer?: string;
}

export interface MoodEntry {
  id?: string;
  user_id?: string;
  date: string;
  mood: Mood;
  checkin_data?: MoodCheckinData;
}

export interface UserProfile {
  id?: string;
  name: string;
  path: string;
  reason: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export enum Screen {
  Auth = 'auth',
  Login = 'login',
  Onboarding = 'onboarding',
  Home = 'home',
  Chat = 'chat',
  Games = 'games',
  Reports = 'reports',
  Settings = 'settings',
  News = 'news',
  Gratitude = 'gratitude',
}

export enum ChatMode {
  QUICK = 'quick',
  DEEP = 'deep',
  SEARCH = 'search',
  IMAGE = 'image',
  LIVE = 'live'
}

export interface ChatMessage {
  id: string;
  user_id?: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: { uri: string; title: string; }[];
  timestamp: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundVolume: number;
  iconSet: string;
  healthIntegrations?: {
    googleFit: boolean;
    appleHealth: boolean;
  };
  highScores?: {
    memory: { easy: number | null; medium: number | null; hard: number | null };
    sequence: number;
    dilemma: number;
  };
}

export interface WellnessTipData {
  text: string;
  author?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  category: string;
  color?: string;
}
