import Link from "next/link";
import { Palette, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-saffron">
                                <Palette className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold gradient-text">KalaKriti</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Connecting India&apos;s finest artisans with the world. Every purchase supports traditional craftsmanship.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Explore</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/marketplace" className="hover:text-terracotta transition-colors">Marketplace</Link></li>
                            <li><Link href="/map" className="hover:text-terracotta transition-colors">Craft Map</Link></li>
                            <li><Link href="/marketplace?category=Pottery" className="hover:text-terracotta transition-colors">Pottery</Link></li>
                            <li><Link href="/marketplace?category=Textiles" className="hover:text-terracotta transition-colors">Textiles</Link></li>
                        </ul>
                    </div>

                    {/* For Artisans */}
                    <div>
                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">For Artisans</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/artisan/dashboard" className="hover:text-terracotta transition-colors">Artisan Dashboard</Link></li>
                            <li><Link href="/artisan/products/new" className="hover:text-terracotta transition-colors">Upload Product</Link></li>
                            <li><span className="text-muted-foreground">AI-Powered Listings</span></li>
                            <li><span className="text-muted-foreground">Voice Upload</span></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Support</h4>
                        <ul className="space-y-2 text-sm">
                            <li><span className="text-muted-foreground">Help Center</span></li>
                            <li><span className="text-muted-foreground">Shipping Info</span></li>
                            <li><span className="text-muted-foreground">Returns Policy</span></li>
                            <li><span className="text-muted-foreground">Contact Us</span></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        Made with <Heart className="h-3.5 w-3.5 fill-terracotta text-terracotta" /> for India&apos;s artisans
                    </p>
                    <p className="text-sm text-muted-foreground">© 2026 KalaKriti. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
