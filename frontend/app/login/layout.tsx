import type { Metadata } from "next";
import type { ReactNode } from "react";
import LoginLayoutClient from "./LoginLayoutClient";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to 42 Connect to join student channels, follow projects, and message classmates securely.",
  alternates: {
    canonical: absoluteUrl("/login"),
  },
  openGraph: {
    title: "Sign in | 42 Connect",
    description:
      "Sign in to 42 Connect to join student channels, follow projects, and message classmates securely.",
    url: absoluteUrl("/login"),
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <LoginLayoutClient>{children}</LoginLayoutClient>;
}
