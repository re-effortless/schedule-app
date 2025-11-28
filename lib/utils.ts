// lib\utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwindのクラス結合用ユーティリティ (shadcn/ui等でも使われる標準的なもの)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- 定数 ---
export const SLOT_MINUTES = 15; // 集計粒度

// --- 時間変換ロジック ---

// HH:mm -> 分 (0-1439)
export const timeToMinutes = (timeStr: string | null | undefined, isStart = true) => {
  if (!timeStr) {
    return isStart ? 0 : 24 * 60;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// 分 -> HH:mm
export const minutesToTime = (totalMinutes: number) => {
  if (totalMinutes >= 24 * 60) return "24:00";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 時間帯の反転 (WhiteList <-> BlackList 変換用)
export const invertTimeRanges = (ranges: { start: string; end: string }[]) => {
  if (!ranges || ranges.length === 0) {
    return [{ start: '', end: '' }];
  }

  const sorted = ranges.map(r => ({
    start: timeToMinutes(r.start, true),
    end: timeToMinutes(r.end, false)
  })).sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  if (sorted.length > 0) {
    let curr = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start <= curr.end) {
        curr.end = Math.max(curr.end, sorted[i].end);
      } else {
        merged.push(curr);
        curr = sorted[i];
      }
    }
    merged.push(curr);
  }

  const inverted = [];
  let currentHead = 0;
  
  merged.forEach(r => {
    if (r.start > currentHead) {
      inverted.push({ start: currentHead, end: r.start });
    }
    currentHead = Math.max(currentHead, r.end);
  });
  
  if (currentHead < 24 * 60) {
    inverted.push({ start: currentHead, end: 24 * 60 });
  }

  return inverted.map(r => ({
    start: r.start === 0 ? '' : minutesToTime(r.start),
    end: r.end === 24 * 60 ? '' : minutesToTime(r.end)
  }));
};

// 日付文字列ソート
export const sortDates = (dateStrs: string[]) => {
  return [...dateStrs].sort((a, b) => a.localeCompare(b));
};