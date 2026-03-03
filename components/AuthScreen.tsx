"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Chrome } from "lucide-react";

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}

export default function AuthScreen({ onSignIn, onSignUp, onGoogle }: AuthScreenProps) {
  const { colors } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password, name);
      } else {
        await onSignIn(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await onGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.bg} px-4`}>
      <div className={`w-full max-w-sm ${colors.surface} rounded-2xl ${colors.shadow} border ${colors.border} p-8 animate-fade-up`}>
        {/* Logo */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${colors.primary} mb-3`}>
            <span className="text-2xl font-black text-white">M</span>
          </div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>MoneyMap</h1>
          <p className={`text-sm ${colors.textSecondary} mt-1`}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${colors.border} ${colors.inputBg}`}>
              <User size={16} className={colors.textSecondary} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${colors.text} placeholder:${colors.textSecondary}`}
                required
              />
            </div>
          )}

          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${colors.border} ${colors.inputBg}`}>
            <Mail size={16} className={colors.textSecondary} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 bg-transparent outline-none text-sm ${colors.text} placeholder:${colors.textSecondary}`}
              required
            />
          </div>

          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${colors.border} ${colors.inputBg}`}>
            <Lock size={16} className={colors.textSecondary} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`flex-1 bg-transparent outline-none text-sm ${colors.text} placeholder:${colors.textSecondary}`}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`${colors.textSecondary} hover:opacity-70`}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl ${colors.primary} text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {loading ? (
              <div className="mm-spinner" />
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className={`my-4 flex items-center gap-3`}>
          <div className={`flex-1 h-px ${colors.border} border-t`} />
          <span className={`text-xs ${colors.textSecondary}`}>or</span>
          <div className={`flex-1 h-px ${colors.border} border-t`} />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl border ${colors.border} ${colors.surface} ${colors.text} font-medium text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50`}
        >
          <Chrome size={16} /> Continue with Google
        </button>

        <p className={`mt-5 text-center text-xs ${colors.textSecondary}`}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className={`font-medium ${colors.text} underline`}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
