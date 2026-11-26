import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Alert } from "../components/ui";
import type { User } from "../types/auth";

type LoginPortal = "student" | "admin";

export default function LoginPage() {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { message?: string } | null)?.message;

  const [portal, setPortal] = useState<LoginPortal>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function switchPortal(nextPortal: LoginPortal) {
    setPortal(nextPortal);
    setError("");
  }

  function routeAuthenticatedUser(loggedInUser: User) {
    const role = loggedInUser.role.toLowerCase();

    if (portal === "admin" && role !== "admin" && role !== "organiser") {
      logout();
      setError("Access denied. This account does not have organiser or admin privileges.");
      return;
    }

    if (portal === "student" && (role === "admin" || role === "organiser")) {
      logout();
      setError("Please use the Organiser / Admin tab to sign in with this account.");
      return;
    }

    navigate(
      role === "admin" || role === "organiser" ? "/admin-dashboard" : "/student-dashboard",
      { replace: true }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      routeAuthenticatedUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    try {
      const loggedInUser = await loginWithGoogle();
      routeAuthenticatedUser(loggedInUser);
    } catch (err: unknown) {
      const firebaseCode =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
      if (firebaseCode === "auth/popup-closed-by-user") {
        setError("Google sign-in popup was closed before completing.");
      } else {
        setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div
        role="tablist"
        aria-label="Login portal"
        className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={portal === "student"}
          onClick={() => switchPortal("student")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            portal === "student"
              ? "bg-accent text-slate-950 shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          <GraduationCap size={16} />
          Student Login
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={portal === "admin"}
          onClick={() => switchPortal("admin")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            portal === "admin"
              ? "bg-accent text-slate-950 shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          <ShieldCheck size={16} />
          Organiser / Admin
        </button>
      </div>

      <h1 className="text-3xl font-bold">
        {portal === "admin" ? "Organiser & Admin Portal" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {portal === "admin"
          ? "Sign in with your approved organiser or administrator credentials."
          : "Log in to see events and manage your registrations."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {notice && !error && <Alert kind="success">{notice}</Alert>}

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={portal === "admin" ? "organiser@campusconnect.edu" : "you@example.com"}
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input input-icon"
            />
          </div>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn btn-primary w-full py-3"
        >
          {loading
            ? "Logging in..."
            : portal === "admin"
              ? "Log in to Portal"
              : "Log in as Student"}
        </button>
      </form>

      {portal === "student" && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-muted">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </button>
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        New to CampusConnect?{" "}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create a student or organiser account
        </Link>
      </p>
    </AuthLayout>
  );
}
