import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Ticket } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/format";

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-ink">
        <Ticket size={20} />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold text-white">CampusConnect</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AppShell({
  subtitle,
  children,
  maxWidth = "max-w-6xl",
}: {
  subtitle: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
        <div className={`mx-auto flex ${maxWidth} items-center justify-between px-5 py-3.5 sm:px-8`}>
          <Brand subtitle={subtitle} />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-raised text-xs font-semibold text-white"
              >
                {initials(user?.name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs capitalize text-muted">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline px-3" aria-label="Log out">
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto ${maxWidth} px-5 py-10 sm:px-8`}>{children}</main>
    </div>
  );
}