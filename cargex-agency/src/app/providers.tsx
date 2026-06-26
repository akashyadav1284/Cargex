"use client";

import { AgencyProvider } from "@/context/AgencyContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AgencyProvider>{children}</AgencyProvider>;
}
