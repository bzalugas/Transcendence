"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";
import { authClient } from "@/lib/auth-client"; 

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pwRules = [
    { label: "12 characters", test: password.length >= 12 },
    { label: "Uppercase & lowercase", test: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", test: /\d/.test(password) },
    { label: "A special character", test: /[^a-zA-Z0-9]/.test(password) },
  ];
  const passwordValid = pwRules.every((r) => r.test);

  const registerUser = async () => {
    setLoading(true);
    setError("");

    const { error } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Registration failed.");
      return;
    }

    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordValid) {
      setError("Password does not meet the requirements.");
      return;
    }

    const accepted = localStorage.getItem("terms_accepted");
    if (accepted === "true") {
      registerUser();
		// router.push("/");
    } else {
      setShowTerms(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("terms_accepted", "true");
    setShowTerms(false);
    registerUser(); // router.push("/");
  };

  const handleDecline = () => {
    setShowTerms(false);
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-7">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-[26px]">
        {/* Header */}
        <Link
          href="/login/guest"
          className="mb-5 flex items-center gap-2 text-[13px] text-text-muted transition-colors hover:text-text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>

        <h1 className="mb-1.5 text-[22px] font-bold tracking-tight">
          Create an account
        </h1>
        <p className="mb-[22px] text-[13.5px] text-text-muted">
          Join the community and connect with your peers
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-muted">
              Password
            </label>
            <div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Min. 12 characters"
					autoComplete="new-password"
					className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 pr-11 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
				/>
				<button
                	type="button"
                	onClick={() => setShowPassword(!showPassword)}
                	className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dimmed transition-colors hover:text-text-primary"
					>
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
                {pwRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        rule.test ? "bg-accent-green" : "bg-text-dimmed"
                      }`}
                    />
                    <span
                      className={`text-[11px] transition-colors ${
                        rule.test ? "text-accent-green" : "text-text-dimmed"
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
		  <div className={`transition-opacity ${!passwordValid ? "pointer-events-none opacity-40" : ""}`}>
			<label className="mb-1.5 block text-[12px] font-medium text-text-muted">
				Confirm password
			</label>
            <input
            	type={showPassword ? "text" : "password"}
            	value={confirmPassword}
            	onChange={(e) => setConfirmPassword(e.target.value)}
            	onPaste={(e) => e.preventDefault()}
            	placeholder="Re-enter your password"
            	autoComplete="new-password"
            	// disabled={!passwordValid}
            	className="w-full rounded-[10px] border border-border-default bg-bg-primary px-3.5 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong disabled:cursor-not-allowed"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
			// disabled={loading}
            className="mt-1 w-full rounded-[14px] bg-btn-primary-bg px-[18px] py-3.5 text-[15px] font-semibold text-btn-primary-text transition-opacity hover:opacity-88 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-[22px] text-center text-[13px] text-text-muted">
          Already have an account?{" "}
          <Link
            href="/login/guest"
            className="font-medium text-text-primary transition-colors hover:text-accent-blue"
          >
            Sign in
          </Link>
        </p>
      </div>

      <TermsAcceptanceModal
        open={showTerms}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
}
