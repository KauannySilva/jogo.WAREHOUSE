'use client';

import dynamic from 'next/dynamic';

const GameClient = dynamic(() => import('@/components/GameClient'), {
  ssr: false,
  loading: () => <div className="loading">Carregando arsenal...</div>,
});

export default function Home() {
  return <GameClient />;
}