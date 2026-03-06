"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Shield, ArrowRight, Award } from "lucide-react";
import { api } from "@/lib/api";

interface Artisan {
    artisan_id: string;
    user_name?: string;
    craft_type: string;
    bio?: string;
    profile_image_url?: string;
    state?: string;
    city?: string;
    rating?: number;
    total_reviews: number;
    verification_status: string;
}

interface Product {
    product_id: string;
    title: string;
    price: number;
    category: string;
    image_url: string;
}

const EMOJIS: Record<string, string> = {
    "Pottery & Ceramics": "🏺", "Textiles & Weaving": "🧵", "Woodwork": "🪵",
    "Metal Craft": "⚱️", "Painting": "🎨", "Jewelry": "💍",
    "Leather Craft": "👜", "Stone Carving": "🗿",
};

export default function ArtisanProfilePage() {
    const params = useParams();
    const artisanId = params.id as string;
    const [artisan, setArtisan] = useState<Artisan | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [artisanData, productsData] = await Promise.allSettled([
                    api.getArtisan(artisanId),
                    api.getArtisanProducts(artisanId),
                ]);
                if (artisanData.status === "fulfilled") setArtisan(artisanData.value as Artisan);
                if (productsData.status === "fulfilled") setProducts(productsData.value as Product[]);
            } catch (err) {
                console.error("Failed to load artisan:", err);
            } finally {
                setLoading(false);
            }
        };
        if (artisanId) fetchData();
    }, [artisanId]);

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-32 rounded-t-xl" />
                <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (!artisan) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-20 text-center">
                <p className="text-4xl mb-4">😔</p>
                <h2 className="text-xl font-bold">Artisan not found</h2>
                <Link href="/marketplace"><Button className="mt-4">Browse Marketplace</Button></Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header Card */}
            <Card className="border-0 shadow-lg overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-terracotta via-saffron to-gold" />
                <CardContent className="relative px-6 pb-6 sm:px-8">
                    <div className="absolute -top-12 left-6 sm:left-8">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-saffron/20 to-terracotta/20 text-4xl shadow-lg overflow-hidden">
                            {artisan.profile_image_url ? (
                                <img src={artisan.profile_image_url} alt={artisan.user_name || ""} className="h-full w-full object-cover" />
                            ) : (
                                "👨‍🎨"
                            )}
                        </div>
                    </div>

                    <div className="ml-0 pt-14 sm:ml-32 sm:pt-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{artisan.user_name || "Artisan"}</h1>
                                    {artisan.verification_status === "verified" && (
                                        <Badge className="border-jade/20 bg-jade/10 text-jade gap-1">
                                            <Shield className="h-3 w-3" /> Verified
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                                    <Award className="h-4 w-4 text-saffron" /> {artisan.craft_type}
                                </p>
                                {(artisan.city || artisan.state) && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3.5 w-3.5" /> {artisan.city}{artisan.city && artisan.state ? ", " : ""}{artisan.state}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {artisan.rating && (
                                    <div className="text-center">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-5 w-5 fill-saffron text-saffron" />
                                            <span className="text-xl font-bold">{artisan.rating}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{artisan.total_reviews} reviews</p>
                                    </div>
                                )}
                                <Button className="bg-gradient-to-r from-terracotta to-saffron text-white border-0">
                                    Contact Artisan
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bio & Products */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card className="border-0 shadow-sm sticky top-24">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-3">About the Artisan</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{artisan.bio || "This artisan hasn't added a bio yet."}</p>
                            <Separator className="my-4" />
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Craft</span>
                                    <span className="font-medium">{artisan.craft_type}</span>
                                </div>
                                {(artisan.city || artisan.state) && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium">{artisan.city}{artisan.city && artisan.state ? ", " : ""}{artisan.state}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Products</span>
                                    <span className="font-medium">{products.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Products by {artisan.user_name || "this Artisan"}</h2>
                    {products.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">🎨</p>
                                <h3 className="font-semibold">No products yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">This artisan hasn&apos;t published any products yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {products.map((product) => (
                                <Link key={product.product_id} href={`/products/${product.product_id}`}>
                                    <Card className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <span className="text-5xl transition-transform group-hover:scale-110">{EMOJIS[product.category] || "🎨"}</span>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold group-hover:text-terracotta transition-colors">{product.title}</h3>
                                            <p className="mt-1 text-lg font-bold gradient-text">₹{product.price.toLocaleString()}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
