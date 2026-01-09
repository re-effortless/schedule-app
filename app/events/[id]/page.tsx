// app\events\[id]\page.tsx :セッション（イベント）のデータ処理

import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma'; // 作成済みのPrismaクライアント
import EventDashboard from '@/components/EventDashboard'; // メインのUIコンポーネント

// URLパラメータの型定義
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

import { cookies } from 'next/headers';
import { PasswordGate } from '@/components/PasswordGate';

// ... (other imports)

// サーバーコンポーネントとして非同期関数(async)を定義
export default async function EventPage({ params }: PageProps) {
  // 1. URLからIDを取得
  const { id } = await params;

  // 2. データベースからデータを取得（まずパスワードのみチェック）
  const eventMeta = await prisma.event.findUnique({
    where: { id },
    select: { password: true }
  });

  if (!eventMeta) {
    notFound();
  }

  // --- パスワード保護のチェック ---
  if (eventMeta.password) {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`event_auth_${id}`);

    // Cookieがない、または無効な場合はGateを表示
    if (!authCookie || authCookie.value !== 'true') {
      return (
        <PasswordGate eventId={id} />
      );
    }
  }

  // 3. データ取得 (フルデータ) - ここまで来たら閲覧可能
  const eventRaw = await prisma.event.findUnique({
    where: { id },
    include: {
      // ... (same as original)
      candidateDates: true,
      participants: {
        include: {
          availabilities: {
            include: {
              timeRanges: true
            }
          }
        }
      }
    }
  });

  if (!eventRaw) {
    notFound(); // Should not happen given previous check
  }

  // 4. データ整形 
  const eventData = {
    // ... (same mapping as original)
    id: eventRaw.id,
    title: eventRaw.title,
    description: eventRaw.description || '',
    candidateDates: eventRaw.candidateDates.map(d => d.dateStr),
    period: {
      start: eventRaw.periodStart.toISOString(),
      end: eventRaw.periodEnd.toISOString(),
    },
    participants: eventRaw.participants.map(p => ({
      id: p.id,
      name: p.name,
      mode: p.mode as 'whitelist' | 'blacklist',
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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      <EventDashboard initialEventData={eventData} />
    </div>
  );
}