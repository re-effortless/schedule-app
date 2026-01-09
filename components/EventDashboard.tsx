// components\EventDashboard.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { InputForm } from './InputForm'; // 元のInputFormを別ファイル化または内部定義
import { ResultList } from './ResultList'; // 元のResultListを別ファイル化
import { saveParticipant, deleteParticipant } from '@/lib/actions';
import { Calendar, Edit3, Check, Plus, Trash2, Pen, Share2 } from 'lucide-react';
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

  const copyShareUrl = () => {
    const url = `${window.location.origin}/events/${eventData.id}`;
    navigator.clipboard.writeText(url);
    alert('共有URLをコピーしました！');
  };

  // ... (以下、元のDashboardのreturn文のUIロジックとほぼ同じ)
  // 変更点: onUpdateEventは不要になり、サーバーアクション経由で更新される

  // タブ切り替えのための簡単なコンポーネント
  const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
        ${active
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* ヘッダーエリア */}
      <div className="bg-white border-b border-indigo-100 sticky top-0 z-20 shadow-sm">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {eventData.title}
            </h1>
            {eventData.description && (
              <p className="text-sm text-gray-500 mt-2 ml-8 whitespace-pre-wrap">{eventData.description}</p>
            )}
          </div>

          <button
            onClick={copyShareUrl}
            className="flex items-center gap-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            共有
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-t border-gray-100">
          <TabButton
            id="input"
            label="回答入力"
            icon={Edit3}
            active={activeTab === 'input'}
            onClick={() => setActiveTab('input')}
          />
          <TabButton
            id="result"
            label="集計結果"
            icon={Check}
            active={activeTab === 'result'}
            onClick={() => setActiveTab('result')}
          />
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* 編集モード: フォームを表示 */}
            {editingParticipant ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <InputForm
                  eventData={eventData}
                  initialData={editingParticipant.id ? editingParticipant : undefined}
                  onSave={handleSaveParticipant}
                  onCancel={() => setEditingParticipant(null)}
                />
              </div>
            ) : (
              /* 一覧モード: 自分の回答を探す/新規作成 */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-blue-800">あなたの回答は？</h3>
                    <p className="text-xs text-blue-600 mt-1">
                      まだ回答していない場合は、新規入力してください。<br />
                      回答済みの場合は、下の一覧から自分の名前を選んで修正できます。
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingParticipant({})}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    新規入力
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                    回答済みメンバー ({eventData.participants.length})
                  </div>
                  {eventData.participants.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      まだ誰も回答していません
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {eventData.participants.map((p: any) => (
                        <li key={p.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              {p.name.slice(0, 1)}
                            </div>
                            <span className="font-medium text-gray-700">{p.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.mode === 'whitelist' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                              {p.mode === 'whitelist' ? '参加可' : '参加不可'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                            <button
                              onClick={() => setEditingParticipant(p)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="修正"
                            >
                              <Pen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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