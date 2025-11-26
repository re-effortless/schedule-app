// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// SQLiteのWALモードを有効化（接続初期化時に実行）
(async () => {
  try {
    await prisma.$connect(); 
    await prisma.$queryRaw`PRAGMA journal_mode = WAL;`;
  } catch (e) {
    // 開発環境のホットリロード等で接続済みの場合のエラーを無視
    // console.error("Failed to enable WAL mode", e);
  }
})();