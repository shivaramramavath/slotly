// React component for page.
import Link from 'next/link';
import { ArrowRight, Layers, Sliders, Cpu, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '@/components/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/** React component rendering home page. */
export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="yellow">PHASE 1 FOUNDATION</Badge>
          <Badge variant="green">SYSTEM OPERATIONAL</Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#FAFAFA] font-sans">
          Academic Scheduling, <br />
          <span className="text-[#8A8A8A]">Architectured for Zero Conflicts.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#8A8A8A] max-w-2xl mx-auto leading-relaxed">
          Design academic structures with a gated visual blueprint. Generate provably conflict-free
          timetables powered by deterministic constraint solving and background write-behind persistence.
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="gap-2">
              <span>Launch Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-12 px-6 max-w-6xl mx-auto border-t border-[#232323]">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <Sliders className="h-5 w-5 text-[#FACC15] mb-2" />
              <CardTitle className="text-sm">Visual Blueprint</CardTitle>
              <CardDescription>
                Topological completion gates guarantee valid parent-child hierarchy before generation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Cpu className="h-5 w-5 text-[#22C55E] mb-2" />
              <CardTitle className="text-sm">Constraint Solver</CardTitle>
              <CardDescription>
                Mathematical solver guarantees no faculty, section, or classroom double-bookings.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Layers className="h-5 w-5 text-[#3B82F6] mb-2" />
              <CardTitle className="text-sm">Interactive Studio</CardTitle>
              <CardDescription>
                Cell-level dnd-kit grid editor with optimistic locking and write-behind BullMQ synchronization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ShieldCheck className="h-5 w-5 text-[#FAFAFA] mb-2" />
              <CardTitle className="text-sm">Enterprise Security</CardTitle>
              <CardDescription>
                Argon2id hashing, Redis session invalidation, and data-driven RBAC permissions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
