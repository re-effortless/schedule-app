// lib/actions.ts
'use server';

import prisma from './prisma';
import { revalidatePath } from 'next/cache';

// イベント作成
// イベント作成
export async function createEvent(data: any) {
  const { title, description, candidateDates, period, password } = data;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      periodStart: period.start, // Date object
      periodEnd: period.end,     // Date object
      password: password || null,
      candidateDates: {
        create: candidateDates.map((d: string) => ({ dateStr: d }))
      }
    }
  });

  return { id: event.id, password: event.password };
}

import { cookies } from 'next/headers';

// パスワード認証 & クッキー設定
export async function unlockEvent(eventId: string, passwordInput: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { password: true }
  });

  if (!event || event.password !== passwordInput) {
    return { success: false, message: 'パスワードが正しくありません' };
  }

  // 認証成功: クッキーを設定 (有効期限: 30日)
  const cookieStore = await cookies();
  cookieStore.set(`event_auth_${eventId}`, 'true', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  return { success: true };
}

// 参加者情報の登録・更新
export async function saveParticipant(eventId: string, participantData: any) {
  const { id, name, mode, availabilities } = participantData;

  // 既存IDがあれば削除して作り直す（または更新）シンプルにトランザクションで置換
  /* 本来はUpdateを使うべきですが、ネストが深いため
     プロトタイプとしては「削除→作成」が実装コストが低くバグりづらいです。
     (IDが変わると不都合がある場合はUpdateロジックを精密に書く必要があります)
  */

  await prisma.$transaction(async (tx) => {
    // 既存の同名ユーザー、あるいはID指定があれば削除
    if (id) {
      await tx.participant.delete({ where: { id } });
    }

    await tx.participant.create({
      data: {
        id: id || undefined, // IDがあれば維持、なければ自動生成
        eventId,
        name,
        mode,
        availabilities: {
          create: availabilities.map((a: any) => ({
            dateStr: a.dateStr,
            memo: a.memo,
            timeRanges: {
              create: a.timeRanges.map((tr: any) => ({
                start: tr.start,
                end: tr.end
              }))
            }
          }))
        }
      }
    });
  });

  revalidatePath(`/events/${eventId}`);
}

// 参加者削除
export async function deleteParticipant(eventId: string, participantId: string) {
  await prisma.participant.delete({
    where: { id: participantId }
  });
  revalidatePath(`/events/${eventId}`);
}