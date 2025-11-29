// lib/actions.ts
'use server';

import prisma from './prisma';
import { revalidatePath } from 'next/cache';

// イベント作成
export async function createEvent(data: any) {
  const { title, description, candidateDates, period } = data;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      periodStart: period.start, // Date object
      periodEnd: period.end,     // Date object
      candidateDates: {
        create: candidateDates.map((d: string) => ({ dateStr: d }))
      }
    }
  });

  return { id: event.id };
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