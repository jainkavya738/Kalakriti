"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
    Menu, X, User, LogOut, LayoutDashboard,
    ShoppingBag, Palette, MapPin, Shield,
} from "lucide-react";
import { LoginDialog } from "./LoginDialog";

export function Navbar() {
    const { user, logout, isArtisan, isAdmin } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 glass">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-saffron transition-transform group-hover:scale-110">
                            <Palette className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            <span className="gradient-text">Kala</span>
                            <span className="text-foreground">Kriti</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-1 md:flex">
                        <Link href="/marketplace">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ShoppingBag className="h-4 w-4" /> Marketplace
                            </Button>
                        </Link>
                        <Link href="/map">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <MapPin className="h-4 w-4" /> Discover
                            </Button>
                        </Link>
                    </div>

                    {/* Right side */}
                    <div className="hidden items-center gap-3 md:flex">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-terracotta to-saffron text-xs font-bold text-white">
                                            {user.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        {user.name}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {isArtisan && (
                                        <Link href="/artisan/dashboard">
                                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                                <LayoutDashboard className="h-4 w-4" /> Artisan Dashboard
                                            </DropdownMenuItem>
                                        </Link>
                                    )}
                                    {!isArtisan && !isAdmin && (
                                        <Link href="/buyer/dashboard">
                                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                                <LayoutDashboard className="h-4 w-4" /> My Orders
                                            </DropdownMenuItem>
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <Link href="/admin/artisans">
                                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                                <Shield className="h-4 w-4" /> Admin Panel
                                            </DropdownMenuItem>
                                        </Link>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive">
                                        <LogOut className="h-4 w-4" /> Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-terracotta to-saffron hover:from-saffron-dark hover:to-terracotta text-white border-0"
                                    onClick={() => setLoginOpen(true)}
                                >
                                    Join as Artisan
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-secondary"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </nav>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <div className="border-t md:hidden animate-in slide-in-from-top-2">
                        <div className="flex flex-col gap-1 p-4">
                            <Link href="/marketplace" onClick={() => setMobileOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <ShoppingBag className="h-4 w-4" /> Marketplace
                                </Button>
                            </Link>
                            <Link href="/map" onClick={() => setMobileOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <MapPin className="h-4 w-4" /> Discover
                                </Button>
                            </Link>
                            <div className="my-2 border-t" />
                            {user ? (
                                <>
                                    {isArtisan && (
                                        <Link href="/artisan/dashboard" onClick={() => setMobileOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start gap-2">
                                                <LayoutDashboard className="h-4 w-4" /> Dashboard
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="ghost" onClick={logout} className="w-full justify-start gap-2 text-destructive">
                                        <LogOut className="h-4 w-4" /> Sign Out
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full bg-gradient-to-r from-terracotta to-saffron text-white"
                                    onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                                >
                                    Sign In / Join
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </header>
            <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        </>
    );
}
