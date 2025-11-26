import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma'; // 作成済みのPrismaクライアント
import EventDashboard from '@/components/EventDashboard'; // メインのUIコンポーネント

// URLパラメータの型定義
interface PageProps {
  params: {
    id: string;
  };
}

// サーバーコンポーネントとして非同期関数(async)を定義
export default async function EventPage({ params }: PageProps) {
  // 1. URLからIDを取得
  const { id } = params;

  // 2. データベースからデータを取得（関連テーブルも結合）
  const eventRaw = await prisma.event.findUnique({
    where: { id },
    include: {
      candidateDates: true, // 候補日テーブル
      participants: {       // 参加者テーブル
        include: {
          availabilities: { // 回答テーブル
            include: {
              timeRanges: true // 時間帯テーブル
            }
          }
        }
      }
    }
  });

  // データが見つからない場合は 404 ページを表示
  if (!eventRaw) {
    notFound();
  }

  // 3. データ整形 (Server Component -> Client Component へ渡すためのシリアライズ)
  // PrismaのDateTime型オブジェクトは、そのままClient Componentに渡すと警告が出る場合があるため、
  // 文字列(ISO String)に変換するのが安全です。
  
  const eventData = {
    id: eventRaw.id,
    title: eventRaw.title,
    description: eventRaw.description || '', // nullの場合は空文字に
    
    // Dateオブジェクト -> 文字列配列
    candidateDates: eventRaw.candidateDates.map(d => d.dateStr),
    
    period: {
      start: eventRaw.periodStart.toISOString(), // 文字列化
      end: eventRaw.periodEnd.toISOString(),     // 文字列化
    },
    
    // ネストされた参加者データの整形
    participants: eventRaw.participants.map(p => ({
      id: p.id,
      name: p.name,
      mode: p.mode as 'whitelist' | 'blacklist', // 型アサーション
      availabilities: p.availabilities.map(a => ({
        dateStr: a.dateStr,
        memo: a.memo || '',
        timeRanges: a.timeRanges.map(tr => ({
          start: tr.start,
          end: tr.end
        }))
      }))
    }))
  };

  // 4. 整形したデータをクライアントコンポーネントに渡す
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      <EventDashboard initialEventData={eventData} />
    </div>
  );
}