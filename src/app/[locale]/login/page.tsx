"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true); setError(null);
      await login(email, password);
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      const msg = typeof err === "object" && err && "message" in err ? String((err as {message: unknown}).message) : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input type="email" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <button className="h-9 w-full rounded-md bg-primary text-primary-foreground text-sm" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

