"use client";

export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const DEMO_ACCOUNTS = [
  { label: "Super Admin (SA)", email: "admin@brandsbridge.com", pass: "Admin@1234" },
  { label: "Chocolate Manager (CM)", email: "chocolate@brandsbridge.com", pass: "Choco@1234" },
  { label: "Cosmetics Manager (COM)", email: "cosmetics@brandsbridge.com", pass: "Cosmo@1234" },
  { label: "Detergents Manager (DM)", email: "detergents@brandsbridge.com", pass: "Deterg@1234" },
  { label: "Finance Manager (FM)", email: "finance@brandsbridge.com", pass: "Finance@1234" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid email or password.",
      });
      setIsLoading(false);
    }
  };

  const setDemoCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">B</div>
          <h1 className="text-3xl font-bold font-headline">BrandsBridge</h1>
          <p className="text-muted-foreground">Smart Business Management Solutions</p>
        </div>

        <Card className="border-border/40 shadow-xl backdrop-blur-sm bg-card/50">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@brandsbridge.com" 
                    className="pl-9"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="px-0 font-normal text-xs h-auto" type="button">Forgot password?</Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-9"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ArrowRight className="mr-2 h-4 w-4" /> Sign In</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid grid-cols-1 gap-2 p-4 rounded-lg bg-secondary/30 border border-border/50">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Quick Demo Access</h4>
           <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_ACCOUNTS.map((acc, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7"
                  onClick={() => setDemoCreds(acc.email, acc.pass)}
                >
                  {acc.label}
                </Button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}