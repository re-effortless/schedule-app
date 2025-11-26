'use client';

import React, { useState, useMemo } from 'react';
import { InputForm } from './InputForm'; // 元のInputFormを別ファイル化または内部定義
import { ResultList } from './ResultList'; // 元のResultListを別ファイル化
import { saveParticipant, deleteParticipant } from '@/lib/actions';
import { Calendar, Edit3, Check, Plus, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';

// ... (ResultList, InputForm のコードは元のコードを流用し、適宜import修正)

export default function EventDashboard({ initialEventData }: { initialEventData: any }) {
  // DBからのデータはpropsで受け取るが、楽観的更新や即時反映のためにstateも持つか、
  // あるいは router.refresh() で再取得を待つ設計にします。
  // 小規模なら router.refresh() が一番簡単です。
  const eventData = initialEventData; 
  
  const [activeTab, setActiveTab] = useState('input');
  const [editingParticipant, setEditingParticipant] = useState<any>(null);

  const handleSaveParticipant = async (participant: any) => {
    // Server Action呼び出し
    await saveParticipant(eventData.id, participant);
    setEditingParticipant(null);
    // UIのリフレッシュはNext.jsがrevalidatePathで自動的に行うが、
    // 必要ならここで router.refresh() を呼ぶ
  };

  const handleDeleteParticipant = async (id: string) => {
    if (confirm('この回答を削除しますか？')) {
      await deleteParticipant(eventData.id, id);
    }
  };

  // ... (以下、元のDashboardのreturn文のUIロジックとほぼ同じ)
  // 変更点: onUpdateEventは不要になり、サーバーアクション経由で更新される
  
  return (
    // ... (UIの実装)
    // <InputForm onSave={handleSaveParticipant} ... /> のように渡す
    <div className="max-w-3xl mx-auto pb-20">
       {/* ヘッダー部分など既存コード流用 */}
       <div className="bg-white border-b border-indigo-100 sticky top-0 z-20 shadow-sm">
          {/* ... */}
       </div>

       <div className="p-4">
        {activeTab === 'input' && (
             // ... InputForm または 参加者リスト表示 ...
             // 参加者リストの削除ボタンで handleDeleteParticipant(p.id) を呼ぶ
             <div>
                {editingParticipant ? (
                    <InputForm 
                        eventData={eventData}
                        initialData={editingParticipant}
                        onSave={handleSaveParticipant}
                        onCancel={() => setEditingParticipant(null)}
                    />
                ) : (
                    // ... 参加者リストと新規作成ボタン ...
                     <button onClick={() => setEditingParticipant({})}>新規入力</button>
                )}
             </div>
        )}
        {activeTab === 'result' && (
             <ResultList event={eventData} />
        )}
       </div>
    </div>
  );
}