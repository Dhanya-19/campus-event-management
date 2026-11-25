import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Hash, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { registerUser } from "../api/auth";
import AuthLayout from "../components/AuthLayout";
import { Alert } from "../components/ui";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<"student" | "organiser">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [usn, setUsn] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "organiser" && !organizationName.trim()) {
      setError("Please enter your club, department, or organization name.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: department.trim() || null,
        phone: phone.trim() || null,
        usn: role === "student" ? usn.trim() || null : null,
        organization_name: role === "organiser" ? organizationName.trim() : null,
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            role === "organiser"
              ? "Organiser account created! An administrator will review and approve your account before you can log in."
              : "Account created successfully! Please log in.",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div
        role="tablist"
        aria-label="Account role"
        className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "student"}
          onClick={() => { setRole("student"); setError(""); }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            role === "student" ? "bg-accent text-slate-950 shadow-sm" : "text-muted hover:text-white"
          }`}
        >
          <GraduationCap size={16} />
          Student
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={role === "organiser"}
          onClick={() => { setRole("organiser"); setError(""); }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            role === "organiser" ? "bg-accent text-slate-950 shadow-sm" : "text-muted hover:text-white"
          }`}
        >
          <ShieldCheck size={16} />
          Event Organiser
        </button>
      </div>

      <h1 className="text-3xl font-bold">
        {role === "organiser" ? "Register as Organiser" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {role === "organiser"
          ? "Host campus events and manage participant registrations once approved by an admin."
          : "Sign up to explore events and hackathons on campus."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              minLength={2}
              maxLength={100}
              required
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input input-icon"
            />
          </div>
        </div>

        {role === "organiser" ? (
          <div>
            <label htmlFor="org" className="label">Club / Organization name</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
              <input
                id="org"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. IEEE Student Branch / Coding Club"
                required
                className="input input-icon"
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="usn" className="label">USN / Student ID (optional)</label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
              <input
                id="usn"
                type="text"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="e.g. 1RV23CS001"
                className="input input-icon"
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dept" className="label">Department (optional)</label>
            <input
              id="dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. CSE / ECE"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone (optional)</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input input-icon"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="input input-icon"
            />
          </div>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading
            ? "Creating account..."
            : role === "organiser"
              ? "Submit Organiser Request"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
