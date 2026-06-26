"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Note: might need to add if missing, assuming standard shadcn.
import { useAgency } from "@/context/AgencyContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, api } = useAgency();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (email && password) {
        const { data } = await api.post("/api/agency/auth/login", { email, password });
        login(data.token, {
          _id: data._id,
          name: data.name,
          ownerName: data.ownerName,
          email: data.email,
          status: data.status,
        });
      } else {
        setError("Please enter all fields");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      <Card className="z-10 w-full max-w-md bg-zinc-950 border-zinc-800 text-white">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              CA
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Cargex Agency Panel</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your credentials provided by the admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-sm font-medium text-red-500 text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="agency@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <a href="#" className="text-xs text-blue-500 hover:underline">Forgot password?</a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              Sign In
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
