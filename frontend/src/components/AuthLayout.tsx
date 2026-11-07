import type { ReactNode } from "react";
import { CalendarCheck, Users, Zap } from "lucide-react";
import { Brand } from "./AppShell";

const points = [
  { icon: CalendarCheck, text: "Browse every event and hackathon on campus in one place." },
  { icon: Zap, text: "Register in one click before the deadline closes." },
  { icon: Users, text: "Keep track of everything you have signed up for." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-panel lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Brand />

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Your next hackathon is a few clicks away.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-soft">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised text-accent">
                  <Icon size={17} />
                </span>
                <span className="pt-1 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative ticket */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-16 w-80 rotate-[-8deg] rounded-2xl border border-dashed border-accent/40 bg-raised/60 p-6"
        >
          <p className="font-display text-2xl font-bold text-white">Admit one</p>
          <p className="mt-1 text-sm text-muted">Your seat is saved.</p>
          <div className="mt-6 h-px w-full border-t border-dashed border-line" />
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="h-8 w-0.5 bg-line" style={{ opacity: i % 3 === 0 ? 1 : 0.5 }} />
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted">CampusConnect © 2026</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}