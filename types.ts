
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'analysis';
  imageData?: string;
}

export enum ExamMode {
  NORMAL = 'Normal',
  EXAM_5_MARKS = '5 Marks Short',
  EXAM_10_MARKS = '10 Marks Detailed',
  VIVA_VOCE = 'Viva/Quiz'
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
