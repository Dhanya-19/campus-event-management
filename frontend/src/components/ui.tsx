import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Alert({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: ReactNode;
}) {
  const isError = kind === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-ok/30 bg-ok/10 text-ok"
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-raised text-muted">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}

export function EventSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex h-56 animate-pulse overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="w-20 border-r border-dashed border-line bg-raised" />
          <div className="flex-1 space-y-3 p-5">
            <div className="h-3 w-1/3 rounded bg-raised" />
            <div className="h-5 w-3/4 rounded bg-raised" />
            <div className="h-3 w-full rounded bg-raised" />
            <div className="h-3 w-2/3 rounded bg-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}