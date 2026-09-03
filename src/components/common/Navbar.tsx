'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDueCount } from '@/lib/db';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/writing', label: '图表写作' },
  { href: '/translation', label: '段落翻译' },
  { href: '/part-b', label: '新题型雷达' },
  { href: '/vocab', label: 'FSRS复习' },
];

export default function Navbar() {
  const pathname = usePathname();
  const dueCount = useLiveQuery(() => getDueCount(), [], 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-10 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="font-bold tracking-tight text-sm">
          ENGLISH-II CRAFT
        </Link>
        <nav className="flex space-x-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-2.5 py-1 rounded font-medium transition-colors',
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                {item.label}
                {item.href === '/vocab' && dueCount > 0 && (
                  <span className="ml-1 text-zinc-400">
                    [<span className="text-zinc-900 font-semibold">{dueCount}</span>]
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className={cn(
            'text-[11px] hover:text-zinc-900',
            pathname === '/settings' ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
          )}
        >
          设置
        </Link>
        <div className="text-zinc-400 font-mono text-[11px] hidden sm:block">
          真题范围: 2023年 (MVP) | 划词抓取已激活
        </div>
      </div>
    </header>
  );
}
