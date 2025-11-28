// components\ResultList.tsx

import React, { useState, useMemo } from 'react';
import { Users, AlertCircle, MessageCircle } from 'lucide-react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { timeToMinutes, minutesToTime, SLOT_MINUTES } from '@/lib/utils';

// --- 型定義 ---
interface ResultListProps {
  event: {
    period: { start: string; end: string };
    candidateDates: string[];
    participants: any[];
  };
}

export const ResultList = ({ event }: ResultListProps) => {
  const { participants, period, candidateDates } = event;
  const [openMemoIndices, setOpenMemoIndices] = useState<number[]>([]);

  const toggleMemo = (index: number) => {
    setOpenMemoIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const aggregatedSlots = useMemo(() => {
    if (participants.length === 0) return [];

    let days: Date[] = [];
    if (candidateDates && candidateDates.length > 0) {
      days = candidateDates.map(d => parseISO(d));
    } else {
      days = eachDayOfInterval({
        start: parseISO(period.start),
        end: parseISO(period.end)
      });
    }
    
    const allSlots: any[] = [];

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      for (let m = 0; m < 24 * 60; m += SLOT_MINUTES) {
        const timeStart = m;
        const timeEnd = m + SLOT_MINUTES;
        
        const availableParticipants = participants.filter(p => {
          const pData = p.availabilities.find((a: any) => a.dateStr === dateStr);
          let isAvailable = false;
          
          if (p.mode === 'whitelist') {
            if (pData && pData.timeRanges.length > 0) {
              isAvailable = pData.timeRanges.some((r: any) => {
                const rStart = timeToMinutes(r.start, true);
                const rEnd = timeToMinutes(r.end, false);
                return (Math.max(rStart, timeStart) < Math.min(rEnd, timeEnd));
              });
            }
          } else { // blacklist
            isAvailable = true;
            if (pData && pData.timeRanges.length > 0) {
              const isBlocked = pData.timeRanges.some((r: any) => {
                const rStart = timeToMinutes(r.start, true);
                const rEnd = timeToMinutes(r.end, false);
                return (Math.max(rStart, timeStart) < Math.min(rEnd, timeEnd));
              });
              if (isBlocked) isAvailable = false;
            }
          }
          return isAvailable;
        });

        const score = availableParticipants.length / participants.length;
        // 参加率50%以上のみ抽出
        if (score >= 0.5) {
            allSlots.push({
                dateStr,
                dateObj: day,
                startMin: timeStart,
                endMin: timeEnd,
                score,
                availableCount: availableParticipants.length,
                attendees: availableParticipants.map(p => p.name),
                absentees: participants.filter(p => !availableParticipants.includes(p)).map(p => p.name)
            });
        }
      }
    });

    const merged = [];
    if (allSlots.length === 0) return [];

    let current = { ...allSlots[0], endMin: allSlots[0].endMin };

    for (let i = 1; i < allSlots.length; i++) {
      const slot = allSlots[i];
      if (
        slot.dateStr === current.dateStr &&
        slot.startMin === current.endMin &&
        slot.availableCount === current.availableCount
      ) {
        current.endMin = slot.endMin;
      } else {
        merged.push(current);
        current = { ...slot, endMin: slot.endMin };
      }
    }
    merged.push(current);

    return merged.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        return a.startMin - b.startMin;
    });

  }, [event]);

  const getScoreIcon = (score: number) => {
    if (score === 1.0) return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold border border-green-200">◎</div>;
    if (score >= 0.75) return <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold border border-indigo-200">〇</div>;
    return <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold border border-yellow-200">△</div>;
  };

  const getMemosForDate = (dateStr: string) => {
    return participants
      .map(p => ({ name: p.name, msg: p.availabilities.find((a: any) => a.dateStr === dateStr)?.memo }))
      .filter(item => item.msg && item.msg.trim() !== '');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2 px-1">
        <span>候補日時リスト (参加率順)</span>
        <span>参加人数: {participants.length}名</span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>まだ回答がありません。</p>
        </div>
      ) : aggregatedSlots.length === 0 ? (
        <div className="text-center py-10 bg-rose-50 rounded-xl text-rose-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
          <p>条件に合う候補日時が見つかりませんでした。</p>
        </div>
      ) : (
        aggregatedSlots.map((slot, idx) => {
          const memos = getMemosForDate(slot.dateStr);
          const hasMemos = memos.length > 0;
          const isMemoOpen = openMemoIndices.includes(idx);

          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-4">
                 {getScoreIcon(slot.score)}
                 <div className="flex-1">
                     <div className="font-bold text-gray-800 text-lg flex items-center gap-3">
                         <span>{format(slot.dateObj, 'MM/dd (E)', { locale: ja })}</span>
                         <span className="text-indigo-700 font-mono">
                             {minutesToTime(slot.startMin)} - {minutesToTime(slot.endMin)}
                         </span>
                     </div>
                     <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2 items-center">
                         <span className="font-medium text-green-700">OK: {slot.attendees.length}人</span>
                         {slot.absentees.length > 0 && (
                             <span className="text-rose-400">NG: {slot.absentees.join(', ')}</span>
                         )}
                         
                         {hasMemos && (
                           <button 
                             onClick={() => toggleMemo(idx)}
                             className={`ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${isMemoOpen ? 'bg-gray-200 text-gray-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                           >
                             <MessageCircle className="w-3 h-3" />
                             {isMemoOpen ? '閉じる' : `メモ (${memos.length})`}
                           </button>
                         )}
                     </div>
                 </div>
               </div>

               {isMemoOpen && hasMemos && (
                 <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 rounded p-2">
                   <div className="text-xs text-gray-500 mb-2 font-bold">この日のメモ:</div>
                   <div className="space-y-2">
                     {memos.map((m, mi) => (
                       <div key={mi} className="flex items-start gap-2 text-sm">
                         <span className="font-bold text-gray-700 whitespace-nowrap">{m.name}:</span>
                         <span className="text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 w-full">{m.msg}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          );
        })
      )}
    </div>
  );
};