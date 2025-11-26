import React, { useState } from 'react';
import { Copy } from 'lucide-react';

// --- TimeSelector --- (5分刻みプルダウン)
interface TimeSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export const TimeSelector = ({ value, onChange, className, placeholder = "--" }: TimeSelectorProps) => {
  const [h, m] = value ? value.split(':') : ['', ''];
  const hours = [...Array(24).keys()].map(i => String(i).padStart(2, '0'));
  const minutes = [...Array(12).keys()].map(i => String(i * 5).padStart(2, '0'));

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newH = e.target.value;
    if (!newH) {
      onChange('');
      return;
    }
    const newM = m || '00';
    onChange(`${newH}:${newM}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newM = e.target.value;
    if (!h) return;
    onChange(`${h}:${newM}`);
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <select 
          value={h} 
          onChange={handleHourChange}
          className={`bg-transparent appearance-none outline-none text-center font-mono cursor-pointer pr-3 py-1 hover:text-indigo-600 transition-colors ${!h ? 'text-gray-400' : 'text-gray-800'}`}
        >
          <option value="">{placeholder}</option>
          {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
        </select>
      </div>
      <span className="text-gray-400 -mx-1">:</span>
      <div className="relative">
        <select 
          value={m} 
          onChange={handleMinuteChange}
          className={`bg-transparent appearance-none outline-none text-center font-mono cursor-pointer pl-3 py-1 hover:text-indigo-600 transition-colors ${!h ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800'}`}
          disabled={!h}
        >
          {!h && <option value="">--</option>}
          {h && minutes.map(minute => <option key={minute} value={minute}>{minute}</option>)}
        </select>
      </div>
    </div>
  );
};

// --- BulkInputModal ---
interface BulkInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (days: number[], start: string, end: string) => void;
}

export const BulkInputModal = ({ isOpen, onClose, onApply }: BulkInputModalProps) => {
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  if (!isOpen) return null;

  const days = [
    { val: 1, label: '月' }, { val: 2, label: '火' }, { val: 3, label: '水' },
    { val: 4, label: '木' }, { val: 5, label: '金' }, { val: 6, label: '土' }, { val: 0, label: '日' }
  ];

  const toggleDay = (val: number) => {
    setSelectedDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Copy className="w-5 h-5 text-indigo-600" /> 一括入力
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">曜日を選択</label>
            <div className="flex gap-2 flex-wrap">
              {days.map(d => (
                <button
                  key={d.val}
                  onClick={() => toggleDay(d.val)}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                    selectedDays.includes(d.val) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">開始時間</label>
              <div className="p-2 border rounded bg-white">
                <TimeSelector value={startTime} onChange={setStartTime} className="w-full" placeholder="--" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">終了時間</label>
              <div className="p-2 border rounded bg-white">
                <TimeSelector value={endTime} onChange={setEndTime} className="w-full" placeholder="--" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            ※ 時間未入力の場合は、それぞれ「00:00」「24:00」として扱われます。
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
          <button
            onClick={() => onApply(selectedDays, startTime, endTime)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold"
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
};
