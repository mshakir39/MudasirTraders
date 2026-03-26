'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const FloatingAIAssistant = dynamic(
  () => import('@/components/FloatingAIAssistant').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', backgroundColor: 'var(--color-primary-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>🤖</div>
  }
);

export default function FloatingAIAssistantWrapper() {
  const pathname = usePathname();

  // Hide AI assistant on landing page
  if (pathname === '/') {
    return null;
  }

  return <FloatingAIAssistant />;
}
