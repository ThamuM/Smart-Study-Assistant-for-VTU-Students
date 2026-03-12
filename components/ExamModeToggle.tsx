
import React from 'react';
import { ExamMode } from '../types';
import { BookOpen, Award, ListChecks, MessageSquareText } from 'lucide-react';

interface ExamModeToggleProps {
  currentMode: ExamMode;
  onModeChange: (mode: ExamMode) => void;
}

const modes = [
  { id: ExamMode.NORMAL, icon: BookOpen, label: 'Standard' },
  { id: ExamMode.EXAM_5_MARKS, icon: ListChecks, label: '5 Marks' },
  { id: ExamMode.EXAM_10_MARKS, icon: Award, label: '10 Marks' },
  { id: ExamMode.VIVA_VOCE, icon: MessageSquareText, label: 'Viva' },
];

export const ExamModeToggle: React.FC<ExamModeToggleProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            currentMode === mode.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <mode.icon size={16} />
          {mode.label}
        </button>
      ))}
    </div>
  );
};
