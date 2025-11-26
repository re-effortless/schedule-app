'use client';

import React from 'react';
import { CreateEventScreen } from '@/components/EventCreationForm'; // 後述のコンポーネント化
import { createEvent } from '@/lib/actions';

export default function Home() {
  // Server Actionを呼び出すラッパー
  const handleCreate = async (data: any) => {
    await createEvent(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <CreateEventScreen onCreate={handleCreate} />
    </div>
  );
}