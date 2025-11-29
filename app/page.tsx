// app\page.tsx

'use client';

import React from 'react';
import { CreateEventScreen } from '@/components/EventCreationForm';
import { createEvent } from '@/lib/actions';

export default function Home() {
  // Server Actionを呼び出すラッパー 
  const handleCreate = async (data: any) => {
    return await createEvent(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <CreateEventScreen onCreate={handleCreate} />
    </div>
  );
}

/* 別案
'use client' はあってもなくても動作しますが、
page.tsx は通常 Server Component (use clientなし) にするのが一般的です。

import React from 'react';
import { CreateEventScreen } from '@/components/EventCreationForm';
import { createEvent } from '@/lib/actions'; // Server Action

export default function Home() {
  // handleCreate ラッパー関数は不要なので削除

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      { }
      <CreateEventScreen onCreate={createEvent} />
    </div>
  );
}
  */
 