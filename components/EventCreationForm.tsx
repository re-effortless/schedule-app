// components\EventCreationForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Check, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, parseISO 
} from 'date-fns';
import { ja } from 'date-fns/locale';

// --- ユーティリティ関数 (日付ソート) ---
const sortDates = (dateStrs: string[]) => {
  return [...dateStrs].sort((a, b) => a.localeCompare(b));
};

// --- サブコンポーネント: DateSelector (カレンダー選択) ---
interface DateSelectorProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  disabled?: boolean;
}

const DateSelector = ({ selectedDates, onChange, disabled = false }: DateSelectorProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);

  // ドラッグ終了検知
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleDate = (dateStr: string, mode: 'add' | 'remove') => {
    if (disabled) return;
    const isSelected = selectedDates.includes(dateStr);
    if (mode === 'add' && !isSelected) {
      onChange([...selectedDates, dateStr]);
    } else if (mode === 'remove' && isSelected) {
      onChange(selectedDates.filter(d => d !== dateStr));
    }
  };

  const handleMouseDown = (dateStr: string) => {
    if (disabled) return;
    setIsDragging(true);
    const isSelected = selectedDates.includes(dateStr);
    const mode = isSelected ? 'remove' : 'add';
    setDragMode(mode);
    toggleDate(dateStr, mode);
  };

  const handleMouseEnter = (dateStr: string) => {
    if (isDragging && dragMode && !disabled) {
      toggleDate(dateStr, dragMode);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 select-none ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft /></button>
        <span className="font-bold text-lg">{format(currentMonth, 'yyyy年 M月')}</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((d, i) => (
          <div key={i} className={`text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDates.includes(dateStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={dateStr}
              onMouseDown={() => handleMouseDown(dateStr)}
              onMouseEnter={() => handleMouseEnter(dateStr)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all cursor-pointer
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-indigo-600 text-white shadow-md font-bold' : 'hover:bg-white hover:shadow-sm'}
                ${isToday && !isSelected ? 'border border-indigo-300' : ''}
              `}
            >
              <span>{format(day, 'd')}</span>
              {isSelected && <Check className="w-3 h-3 absolute bottom-1" />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-right text-sm text-gray-500">
        <span className="text-xs text-gray-400 mr-2">ドラッグで連続選択可</span>
        選択中の日程: <span className="font-bold text-indigo-600">{selectedDates.length}</span> 日
      </div>
    </div>
  );
};

// --- メインコンポーネント: CreateEventScreen ---

interface CreateEventScreenProps {
  onCreate: (data: any) => Promise<void>;
}

export const CreateEventScreen = ({ onCreate }: CreateEventScreenProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert('日程を少なくとも1つ選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const sorted = sortDates(selectedDates);
      const start = parseISO(sorted[0]);
      const end = parseISO(sorted[sorted.length - 1]);

      await onCreate({
        title,
        description,
        candidateDates: sorted,
        period: { start, end },
        participants: []
      });
      // 成功時のリダイレクトはServer Action側で行われるため、ここでは何もしない
    } catch (error) {
      console.error("Failed to create event", error);
      alert("イベントの作成に失敗しました。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-xl my-8">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
        <Calendar className="w-8 h-8" />
        イベントを作成
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">イベント名</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="例: チームランチ会"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-24 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="イベントの詳細や補足事項を入力..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">候補日を選択（複数選択可）</label>
          <DateSelector 
            selectedDates={selectedDates} 
            onChange={setSelectedDates} 
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg
            ${isSubmitting 
              ? 'bg-indigo-400 cursor-not-allowed opacity-80' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              調整表を作成中...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              調整表を作成する
            </>
          )}
        </button>
      </form>
    </div>
  );
};