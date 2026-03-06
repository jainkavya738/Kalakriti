"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Palette } from "lucide-react";

interface LoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
    const { login } = useAuth();
    const [mode, setMode] = useState<"signin" | "register">("signin");
    const [role, setRole] = useState<"buyer" | "artisan">("buyer");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Dev mode: use email as the token (Firebase not configured)
            const devToken = email || "dev-user";
            const result = await api.verifyToken(devToken, {
                id_token: devToken,
                role: role,
                name: name || email.split("@")[0] || "User",
            }) as { id: string; name: string; email?: string; role: string; firebase_uid: string; is_active: boolean };

            login(devToken, result);
            onOpenChange(false);
            setName("");
            setEmail("");
        } catch (err) {
            console.error("Login failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-saffron">
                            <Palette className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl">
                            {mode === "signin" ? "Welcome Back" : "Join KalaKriti"}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {mode === "signin"
                            ? "Sign in to your account to continue."
                            : "Create your account to start your journey."
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {mode === "register" && (
                        <>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                                <Input
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">I want to...</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRole("buyer")}
                                        className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${role === "buyer"
                                                ? "border-terracotta bg-terracotta/5 text-terracotta"
                                                : "border-border hover:border-muted-foreground/30"
                                            }`}
                                    >
                                        🛍️ Buy Crafts
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("artisan")}
                                        className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${role === "artisan"
                                                ? "border-saffron bg-saffron/5 text-saffron-dark"
                                                : "border-border hover:border-muted-foreground/30"
                                            }`}
                                    >
                                        🎨 Sell My Craft
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-terracotta to-saffron hover:from-saffron-dark hover:to-terracotta text-white border-0"
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        {mode === "signin" ? (
                            <>
                                New to KalaKriti?{" "}
                                <button type="button" onClick={() => setMode("register")} className="font-medium text-terracotta hover:underline">
                                    Create account
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button type="button" onClick={() => setMode("signin")} className="font-medium text-terracotta hover:underline">
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}
