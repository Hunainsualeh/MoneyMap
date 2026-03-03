"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DesignProvider } from "@/contexts/DesignContext";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <ThemeProvider>
      <DesignProvider>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </DesignProvider>
    </ThemeProvider>
  );
}