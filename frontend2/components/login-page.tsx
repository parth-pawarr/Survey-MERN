"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type Surveyor,
  authenticateUser,
} from "@/lib/store";
import { AlertTriangle } from "lucide-react";

interface LoginPageProps {
  onAdminLogin: () => void;
  onSurveyorLogin: (surveyor: Surveyor) => void;
}

export function LoginPage({ onAdminLogin, onSurveyorLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      setError("Invalid username or password.");
      return;
    }
    const result = authenticateUser(username, password);
    if (!result) {
      setError("Invalid username or password.");
      return;
    }
    if (result.role === "admin") {
      onAdminLogin();
    } else {
      onSurveyorLogin(result.surveyor);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-foreground">Household Survey System</CardTitle>
          <p className="text-sm text-muted-foreground">Login to continue</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertTriangle className="size-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-username" className="text-xs">Username</Label>
            <Input
              id="login-username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password" className="text-xs">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="h-9"
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>
          <Button onClick={handleLogin} className="mt-1">Login</Button>
        </CardContent>
      </Card>
    </div>
  );
}
