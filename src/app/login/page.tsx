"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DEMO_USERS } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Real Firebase Authentication session
      await signInAnonymously(auth);

      const user = DEMO_USERS.find(u => u.email === email);
      
      if (user) {
        localStorage.setItem("demoUser", JSON.stringify(user));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}! Please remember to activate admin status in System Hub.`,
        });
        
        if (user.department !== 'all') {
          router.push(`/department/${user.department}`);
        } else {
          router.push("/");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid email or password. Please try again or use the switcher.",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Could not connect to Firebase Auth.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">B</div>
          <h1 className="text-3xl font-bold font-headline">BizFlow</h1>
          <p className="text-muted-foreground">Smart Business Management Solutions</p>
        </div>

        <Card className="border-border/40 shadow-xl backdrop-blur-sm bg-card/50">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your department.</CardDescription>
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
                  <Button variant="link" className="px-0 font-normal text-xs h-auto">Forgot password?</Button>
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
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account? <span className="text-primary font-bold cursor-pointer">Request Access</span>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="grid grid-cols-1 gap-2 p-4 rounded-lg bg-secondary/30 border border-border/50">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Quick Demo Access</h4>
           <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_USERS.filter(u => u.role === 'admin' || u.role === 'manager').slice(0, 4).map(u => (
                <Button 
                  key={u.id} 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7"
                  onClick={() => { setEmail(u.email); setPassword('password'); }}
                >
                  {u.name.split(' ')[0]} ({u.department[0].toUpperCase()})
                </Button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}