import { ModelParams } from '@google/generative-ai';

export interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  phone: string;
  enrichmentData?: string;
  emailStatus?: 'pending' | 'valid' | 'invalid';
  emailSent?: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingLog {
  id: string;
  stage: 'blacklist' | 'enrichment' | 'verification' | 'email';
  status: 'success' | 'error';
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Settings {
  id: string;
  // Google Integration
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: string;
  
  // Sheet IDs
  blacklistSheetId: string;
  contactsSheetId: string;
  
  // Execution Settings
  autoExecutionEnabled: boolean;
  cronSchedule?: string;
  lastExecutionAt?: string;
  
  // AI Settings
  geminiApiKey?: string;
  geminiModel?: string;
  geminiTemperature?: number;
  geminiTopK?: number;
  geminiTopP?: number;
  useGoogleSearch?: boolean;
  
  // Prompt Templates
  enrichmentPrompt?: string;
  emailPrompt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ApiUsage {
  id: string;
  service: 'gemini' | 'gmail' | 'sheets' | 'disify';
  endpoint: string;
  status: 'success' | 'error';
  responseTime: number;
  cost?: number;
  createdAt: string;
}

export interface EmailHistory {
  id: string;
  user_id: string;
  email: string;
  subject: string;
  status: 'sent' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: string;
  user_id: string;
  email: string;
  status: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
}

export interface AiSettings {
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  useGoogleSearch: boolean;
  prompts: {
    enrichment: string;
    email: string;
  };
}
