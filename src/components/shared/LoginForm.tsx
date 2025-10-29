import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = "/admin/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call API route to handle login server-side
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sign in");
      }

      // SUCCESS! Redirect to page specified by server (based on user role)
      window.location.href = result.redirectTo || redirectTo;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </Label>
        <Input
          type="password"
          id="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

