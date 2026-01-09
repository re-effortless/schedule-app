// components\UIComponents.tsx

import React, { useState } from 'react';
import { Copy } from 'lucide-react';

// --- TimeSelector (Popover with Scrollable Lists) ---
interface TimeSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export const TimeSelector = ({ value, onChange, className, placeholder = "--" }: TimeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value ? value.split(':') : ['', ''];

  const hours = [...Array(24).keys()].map(i => String(i).padStart(2, '0'));
  const minutes = [...Array(12).keys()].map(i => String(i * 5).padStart(2, '0'));

  const handleSelect = (newH: string, newM: string) => {
    if (!newH && !newM) {
      onChange('');
    } else {
      const finalH = newH || '00';
      const finalM = newM || '00';
      onChange(`${finalH}:${finalM}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center gap-1 w-full px-2 py-1.5 
          border border-gray-200 rounded-md bg-white 
          text-sm font-mono transition-all
          ${isOpen ? 'ring-2 ring-indigo-100 border-indigo-400' : 'hover:border-indigo-300'}
          ${!h ? 'text-gray-400' : 'text-gray-900 font-bold'}
        `}
      >
        {value || <span className="text-gray-300">{placeholder}</span>}
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-white rounded-lg shadow-xl border border-gray-100 w-48 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-2 h-48">
              {/* Hours Column */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="text-xs font-bold text-gray-400 text-center sticky top-0 bg-white py-1">時</div>
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleSelect(hour, m)}
                    className={`
                                    py-1 px-2 text-sm rounded transition-colors
                                    ${h === hour
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'hover:bg-indigo-50 text-gray-700'
                      }
                                `}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              <div className="w-px bg-gray-100 my-2" />

              {/* Minutes Column */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                <div className="text-xs font-bold text-gray-400 text-center sticky top-0 bg-white py-1">分</div>
                {minutes.map(minute => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleSelect(h || '00', minute)}
                    className={`
                                    py-1 px-2 text-sm rounded transition-colors
                                    ${m === minute
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'hover:bg-indigo-50 text-gray-700'
                      }
                                `}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="w-full mt-2 pt-2 border-t border-gray-100 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 py-1 rounded transition-colors"
            >
              選択を解除
            </button>
          </div>
        </>
      )}
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
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${selectedDays.includes(d.val) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
