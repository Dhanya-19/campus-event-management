import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Alert } from "../components/ui";

type LoginPortal = "student" | "admin";

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { message?: string } | null)?.message;

  const [portal, setPortal] = useState<LoginPortal>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchPortal(nextPortal: LoginPortal) {
    setPortal(nextPortal);
    setError("");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
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

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading
            ? "Logging in..."
            : portal === "admin"
              ? "Log in to Portal"
              : "Log in as Student"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New to CampusConnect?{" "}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create a student or organiser account
        </Link>
      </p>
    </AuthLayout>
  );
}
