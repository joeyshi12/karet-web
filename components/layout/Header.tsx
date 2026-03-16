'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const isTransactions = pathname === '/transactions';

  return (
    <header className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg shadow-sm sm:px-4 sm:py-2.5">
      <Link href="/" className="shrink-0 text-xl font-bold text-carrot-orange hover:opacity-80 sm:text-[1.375rem] lg:text-2xl">
        <Image src="/karet-logo.svg" alt="" width={28} height={28} className="inline-block align-middle -mt-0.5 mr-1" />
        Karet
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className={`transition-colors ${isDashboard ? 'text-carrot-orange font-medium' : 'text-leafy-green hover:text-carrot-orange'}`}
        >
          Dashboard
        </Link>
        <Link
          href="/transactions"
          className={`transition-colors ${isTransactions ? 'text-carrot-orange font-medium' : 'text-leafy-green hover:text-carrot-orange'}`}
        >
          Transactions
        </Link>
      </nav>
    </header>
  );
}
