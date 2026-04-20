"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handle42Login = async () => {
    await authClient.signIn.social({
      provider: "42school",
      callbackURL: "/dashboard", // where to redirect after 42 login
    });
  };

  return (
    <div>
      <h1>Sign Up</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleEmailSignup}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up with Email"}
        </button>
      </form>

      <hr />

      <button onClick={handle42Login}>
        Sign up with 42
      </button>
    </div>
  );
}