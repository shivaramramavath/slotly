// React component for logo.
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Interface defining structure for logo props. */
export interface LogoProps {
  className?: string;
  href?: string;
}

/** React component rendering logo. */
export function Logo({ className, href = '/' }: LogoProps) {
  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none cursor-pointer', className)}>
      <div className="relative flex h-7 w-7 items-center justify-center rounded border border-[#232323] bg-[#111111]">
        <div className="h-2 w-2 rounded-full bg-[#FACC15]" />
      </div>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-bold tracking-tight text-[#FAFAFA]">SLOTLY</span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
