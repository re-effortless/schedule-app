// components\InputForm.tsx :予定の入力

import React, { useState, useMemo } from 'react';
import {
  Check, X, Copy, AlertCircle, Plus, Clock, Trash2, Loader2
} from 'lucide-react';
import { format, parseISO, getDay, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TimeSelector, BulkInputModal } from './UIComponents';
import { invertTimeRanges } from '@/lib/utils';

// --- 型定義 ---
interface EventData {
  id: string;
  candidateDates: string[];
  period: { start: string; end: string }; // JSON化対応のためstring
}

interface ParticipantInput {
  id?: string;
  name: string;
  mode: 'whitelist' | 'blacklist';
  availabilities: {
    dateStr: string;
    timeRanges: { start: string; end: string }[];
    memo: string;
  }[];
}

interface InputFormProps {
  eventData: EventData;
  initialData?: any; // 編集時は既存データが入る
  onSave: (data: ParticipantInput) => Promise<void>;
  onCancel: () => void;
}

export const InputForm = ({ eventData, onSave, onCancel, initialData }: InputFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [mode, setMode] = useState<'whitelist' | 'blacklist'>(initialData?.mode || 'whitelist');
  const [availabilities, setAvailabilities] = useState<any[]>(initialData?.availabilities || []);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 対象となる日付リストの生成
  const targetDates = useMemo(() => {
    if (eventData.candidateDates && eventData.candidateDates.length > 0) {
      return eventData.candidateDates.map(d => parseISO(d));
    }
    // 期間指定の場合
    return eachDayOfInterval({
      start: parseISO(eventData.period.start),
      end: parseISO(eventData.period.end)
    });
  }, [eventData]);

  // モード変更時のハンドラ（自動変換ロジック）
  const handleModeChange = (newMode: 'whitelist' | 'blacklist') => {
    const hasInput = availabilities.some(d => d.timeRanges.length > 0);

    if (hasInput) {
      const confirmMsg = `入力モードを「${newMode === 'whitelist' ? '参加可' : '参加不可'}」に変更します。\n\n現在入力されている日時の「逆」を選択状態に変換しますか？`;

      if (window.confirm(confirmMsg)) {
        const converted = targetDates.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const existing = availabilities.find(a => a.dateStr === dateStr);
          const ranges = existing ? existing.timeRanges : [];

          return {
            dateStr,
            timeRanges: invertTimeRanges(ranges),
            memo: existing ? existing.memo : ''
          };
        });

        setAvailabilities(converted);
        setMode(newMode);
      }
    } else {
      setMode(newMode);
    }
  };

  const getDayAvailability = (dateStr: string) => {
    return availabilities.find(a => a.dateStr === dateStr) || { dateStr, timeRanges: [], memo: '' };
  };

  const updateDayData = (dateStr: string, updates: any) => {
    setAvailabilities(prev => {
      const existing = prev.find(a => a.dateStr === dateStr);
      if (existing) {
        return prev.map(a => a.dateStr === dateStr ? { ...a, ...updates } : a);
      } else {
        return [...prev, { dateStr, timeRanges: [], memo: '', ...updates }];
      }
    });
  };

  const addTimeRange = (dateStr: string) => {
    const current = getDayAvailability(dateStr);
    const newRanges = [...current.timeRanges, { start: '', end: '' }];
    updateDayData(dateStr, { timeRanges: newRanges });
  };

  const removeTimeRange = (dateStr: string, index: number) => {
    const current = getDayAvailability(dateStr);
    const newRanges = current.timeRanges.filter((_: any, i: number) => i !== index);
    updateDayData(dateStr, { timeRanges: newRanges });
  };

  const updateTimeRange = (dateStr: string, index: number, field: 'start' | 'end', value: string) => {
    const current = getDayAvailability(dateStr);
    const newRanges = [...current.timeRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    updateDayData(dateStr, { timeRanges: newRanges });
  };

  const handleBulkApply = (selectedDaysOfWeek: number[], start: string, end: string) => {
    const newAvailabilities = [...availabilities];
    targetDates.forEach(day => {
      const dayOfWeek = getDay(day);
      if (selectedDaysOfWeek.includes(dayOfWeek)) {
        const dateStr = format(day, 'yyyy-MM-dd');
        let target = newAvailabilities.find(a => a.dateStr === dateStr);
        if (!target) {
          target = { dateStr, timeRanges: [], memo: '' };
          newAvailabilities.push(target);
        }
        target.timeRanges.push({ start, end });
      }
    });
    setAvailabilities(newAvailabilities);
    setBulkModalOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('名前を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        name,
        mode,
        availabilities
      });
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
      setIsSaving(false);
    }
  };

  const getTimeRangeLabel = (start: string, end: string) => {
    if (!start && !end) return "終日 (00:00 - 24:00)";
    if (!start) return `〜 ${end} まで`;
    if (!end) return `${start} 以降 〜`;
    return "";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">あなたの名前</label>
          <input
            type="text"
            placeholder="名前を入力"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isSaving}
            className="w-full text-lg font-bold p-2 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-gray-200 rounded-lg p-1 text-xs sm:text-sm font-medium">
            <button
              onClick={() => handleModeChange('whitelist')}
              disabled={isSaving}
              className={`px-3 py-2 rounded-md flex items-center gap-1 transition-all ${mode === 'whitelist' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Check className="w-4 h-4" /> 参加可を入力
            </button>
            <button
              onClick={() => handleModeChange('blacklist')}
              disabled={isSaving}
              className={`px-3 py-2 rounded-md flex items-center gap-1 transition-all ${mode === 'blacklist' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
            >
              <X className="w-4 h-4" /> 参加不可を入力
            </button>
          </div>

          <button
            onClick={() => setBulkModalOpen(true)}
            disabled={isSaving}
            className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"
          >
            <Copy className="w-4 h-4" /> 一括入力
          </button>
        </div>

        {mode === 'blacklist' && (
          <div className="mt-2 text-xs text-rose-600 flex items-center gap-1 bg-rose-50 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            入力した日時が「NG」として扱われます。何も入力しない日時は「参加可能」となります。
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {targetDates.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const data = getDayAvailability(dateStr);
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;

          return (
            <div key={dateStr} className={`border rounded-lg p-3 ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-gray-700 flex items-center gap-2">
                  {format(day, 'MM/dd (E)', { locale: ja })}
                </div>
                <button
                  onClick={() => addTimeRange(dateStr)}
                  disabled={isSaving}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-full flex items-center gap-1 border border-indigo-100"
                >
                  <Plus className="w-3 h-3" /> 時間を追加
                </button>
              </div>

              <div className="space-y-2">
                {data.timeRanges.length === 0 && (
                  <p className="text-xs text-gray-400 py-1 pl-1">
                    {mode === 'whitelist' ? '指定なし (不可)' : '指定なし (終日可)'}
                  </p>
                )}
                {data.timeRanges.map((range: any, idx: number) => {
                  const statusLabel = getTimeRangeLabel(range.start, range.end);
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 p-2 rounded border border-dashed border-gray-300 bg-gray-50/50">
                      <div className={`flex items-center gap-1 flex-1 p-1 rounded border bg-white ${mode === 'whitelist' ? 'border-indigo-200' : 'border-rose-200'}`}>
                        <Clock className={`w-4 h-4 ${mode === 'whitelist' ? 'text-indigo-400' : 'text-rose-400'}`} />
                        <TimeSelector
                          value={range.start}
                          onChange={(val) => updateTimeRange(dateStr, idx, 'start', val)}
                          className="flex-1"
                          placeholder="--"
                        />
                        <span className="text-gray-400 px-1">〜</span>
                        <TimeSelector
                          value={range.end}
                          onChange={(val) => updateTimeRange(dateStr, idx, 'end', val)}
                          className="flex-1"
                          placeholder="--"
                        />
                      </div>

                      <div className="flex justify-between items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-medium text-gray-500 min-w-[80px]">
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => removeTimeRange(dateStr, idx)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <input
                  type="text"
                  placeholder="メモ (例: 遅れるかも)"
                  value={data.memo}
                  onChange={(e) => updateDayData(dateStr, { memo: e.target.value })}
                  className="w-full text-xs border-b border-dashed border-gray-300 focus:border-indigo-400 outline-none py-1 bg-transparent placeholder-gray-400"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t bg-white flex gap-3">
        <button onClick={onCancel} disabled={isSaving} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50">
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 flex justify-center items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          保存する
        </button>
      </div>

      <BulkInputModal
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onApply={handleBulkApply}
      />
    </div>
  );
};