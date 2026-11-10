// Server component rendering the public marketing landing page and enforcing session redirect.
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowRight, Cpu, Layers, ShieldCheck, Sliders } from 'lucide-react';
import { PublicLayout } from '@/components/layouts/public-layout';
import { PageContainer } from '@/components/layouts/page-container';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { getLandingAuthRedirect } from '@/features/auth/services/session-validator';

interface FeatureHighlight {
  icon: typeof Sliders;
  title: string;
  description: string;
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Sliders,
    title: 'Visual Blueprint',
    description:
      'Topological completion gates guarantee valid parent-child hierarchy before generation.',
  },
  {
    icon: Cpu,
    title: 'Constraint Solver',
    description:
      'Mathematical solver guarantees no faculty, section, or classroom double-bookings.',
  },
  {
    icon: Layers,
    title: 'Interactive Studio',
    description:
      'Cell-level dnd-kit grid editor with optimistic locking and write-behind BullMQ synchronization.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description:
      'Argon2id hashing, Redis session invalidation, and data-driven RBAC permissions.',
  },
];

/** React server component rendering landing page or redirecting active authenticated sessions to dashboard. */
export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get('slotly_session')?.value ||
    cookieStore.get('slotly_rt')?.value ||
    cookieStore.get('refreshToken')?.value;

  const redirectUrl = await getLandingAuthRedirect(sessionCookie);
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <PublicLayout>
      <PageContainer>
        {/* Hero Section */}
        <section className="pt-10 sm:pt-14 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-[56px] font-semibold tracking-tight text-[#FAFAFA] leading-[1.1] [text-wrap:balance]">
            Academic Scheduling,{' '}
            <span className="text-[#8A8A8A]">Architected for Zero Conflicts.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-[#8A8A8A] max-w-[620px] mx-auto leading-relaxed mt-5 sm:mt-6">
            Design academic structures with a gated visual blueprint. Generate provably
            conflict-free timetables powered by deterministic constraint solving and background
            write-behind persistence.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="primary"
                className="h-11 px-6 rounded-[12px] font-medium gap-2 select-none"
              >
                <span>Launch Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button
                variant="outline"
                className="h-11 px-6 rounded-[12px] font-medium border-[#232323] hover:border-[#383838] select-none"
              >
                Explore Templates
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section
          aria-label="Platform Highlights"
          className="mt-12 sm:mt-[72px]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <SurfaceCard
                key={title}
                variant="static"
                className="p-6 min-h-0 flex flex-col justify-start rounded-[20px] bg-[#111111] border border-[#232323]"
              >
                <Icon className="h-8 w-8 text-[#FAFAFA]" aria-hidden="true" />
                <h2 className="mt-4 text-[18px] font-semibold text-[#FAFAFA] tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-[#8A8A8A] leading-relaxed line-clamp-4">
                  {description}
                </p>
              </SurfaceCard>
            ))}
          </div>
        </section>
      </PageContainer>
    </PublicLayout>
  );
}
