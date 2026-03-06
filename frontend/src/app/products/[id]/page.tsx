"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart, ShoppingBag, MapPin, Share2, Shield, Truck, Globe, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Product {
    product_id: string;
    title: string;
    description: string;
    cultural_story?: string;
    price: number;
    currency: string;
    category: string;
    tags: string[];
    image_url: string;
    audio_url?: string;
    is_published: boolean;
    artisan_id: string;
    stock_quantity: number;
    language: string;
}

interface ArtisanInfo {
    artisan_id: string;
    user_name?: string;
    craft_type: string;
    state?: string;
    city?: string;
    rating?: number;
    total_reviews: number;
    verification_status: string;
}

interface Review {
    review_id: string;
    buyer_name?: string;
    rating: number;
    comment?: string;
    created_at: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id as string;
    const { user, token } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [artisan, setArtisan] = useState<ArtisanInfo | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [buying, setBuying] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const prod = await api.getProduct(productId) as Product;
                setProduct(prod);

                // Fetch artisan and reviews in parallel
                const [artisanData, reviewsData] = await Promise.allSettled([
                    api.getArtisan(prod.artisan_id),
                    api.getProductReviews(productId),
                ]);
                if (artisanData.status === "fulfilled") setArtisan(artisanData.value as ArtisanInfo);
                if (reviewsData.status === "fulfilled") setReviews(reviewsData.value as Review[]);
            } catch (err) {
                console.error("Failed to load product:", err);
                toast.error("Product not found");
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchData();
    }, [productId]);

    const handleBuy = async () => {
        if (!user || !token) {
            toast.error("Please sign in to purchase");
            return;
        }
        if (!product) return;
        setBuying(true);
        try {
            const result = await api.createCheckout(token, {
                items: [{ product_id: product.product_id, quantity: 1 }],
                shipping_address: {},
                success_url: `${window.location.origin}/buyer/dashboard`,
                cancel_url: window.location.href,
            }) as { checkout_url?: string };
            if (result.checkout_url) {
                window.location.href = result.checkout_url;
            } else {
                toast.success("Order placed successfully!");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to checkout");
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-2">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-20 text-center">
                <p className="text-4xl mb-4">😔</p>
                <h2 className="text-xl font-bold">Product not found</h2>
                <p className="text-muted-foreground mt-2">This product may have been removed or is no longer available.</p>
                <Link href="/marketplace"><Button className="mt-4">Browse Marketplace</Button></Link>
            </div>
        );
    }

    const EMOJIS: Record<string, string> = {
        "Pottery & Ceramics": "🏺", "Textiles & Weaving": "🧵", "Woodwork": "🪵",
        "Metal Craft": "⚱️", "Painting": "🎨", "Jewelry": "💍",
        "Leather Craft": "👜", "Stone Carving": "🗿",
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <span>/</span>
                <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
                <span>/</span>
                <span className="text-foreground">{product.category}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-muted aspect-square flex items-center justify-center">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-9xl animate-float">{EMOJIS[product.category] || "🎨"}</span>
                    )}
                    <button
                        className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${isSaved ? "bg-terracotta text-white" : "bg-white/80 hover:bg-white"}`}
                        onClick={() => setIsSaved(!isSaved)}
                    >
                        <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                    <Badge className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-foreground border-0">
                        {EMOJIS[product.category] || "🎨"} {product.category}
                    </Badge>
                </div>

                {/* Details */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        {artisan?.verification_status === "verified" && (
                            <Badge variant="secondary" className="border-jade/20 bg-jade/10 text-jade">
                                <Shield className="mr-1 h-3 w-3" /> Verified Artisan
                            </Badge>
                        )}
                        <Badge variant="secondary" className="border-saffron/20 bg-saffron/10 text-saffron-dark">
                            Handcrafted
                        </Badge>
                    </div>

                    <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
                        {product.title}
                    </h1>

                    {/* Price */}
                    <div className="mt-5">
                        <p className="text-3xl font-bold gradient-text">₹{product.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground mt-1">Inclusive of all taxes • Free shipping</p>
                    </div>

                    <Separator className="my-6" />

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">{product.description}</p>

                    {/* Tags */}
                    {product.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {product.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                        </div>
                    )}

                    <Separator className="my-6" />

                    {/* Buy Actions */}
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            className="flex-1 gap-2 bg-gradient-to-r from-terracotta to-saffron hover:from-saffron-dark hover:to-terracotta text-white border-0 shadow-lg shadow-terracotta/20"
                            onClick={handleBuy}
                            disabled={buying || product.stock_quantity <= 0}
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {product.stock_quantity <= 0 ? "Out of Stock" : `Buy Now — ₹${product.price.toLocaleString()}`}
                        </Button>
                        <Button size="lg" variant="outline" className="gap-2">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Info badges */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                        {[
                            { icon: Shield, label: "Authenticity Guaranteed" },
                            { icon: Truck, label: "Free Shipping" },
                            { icon: Globe, label: "Multi-Language" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 p-3 text-center">
                                <Icon className="h-4 w-4 text-terracotta" />
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Artisan Card */}
                    {artisan && (
                        <Link href={`/artisans/${artisan.artisan_id}`}>
                            <Card className="mt-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-saffron/20 to-terracotta/20 text-2xl">
                                        👨‍🎨
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold group-hover:text-terracotta transition-colors">{artisan.user_name || "Artisan"}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {artisan.city}{artisan.city && artisan.state ? ", " : ""}{artisan.state}
                                        </p>
                                        {artisan.rating && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="h-3 w-3 fill-saffron text-saffron" />
                                                <span className="text-xs font-medium">{artisan.rating}</span>
                                                <span className="text-xs text-muted-foreground">({artisan.total_reviews} reviews)</span>
                                            </div>
                                        )}
                                    </div>
                                    {artisan.verification_status === "verified" && (
                                        <Badge variant="secondary" className="border-jade/20 bg-jade/10 text-jade text-xs">
                                            <Shield className="mr-1 h-3 w-3" /> Verified
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs: Cultural Story & Reviews */}
            <div className="mt-12">
                <Tabs defaultValue="story">
                    <TabsList className="mb-6">
                        <TabsTrigger value="story" className="gap-1.5">📖 Cultural Story</TabsTrigger>
                        <TabsTrigger value="reviews" className="gap-1.5">⭐ Reviews ({reviews.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="story">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6 sm:p-8">
                                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                                    The Story Behind This Craft
                                </h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {product.cultural_story || "The cultural story for this product is being crafted by our AI. Check back soon!"}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reviews">
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-8 text-center">
                                        <p className="text-3xl mb-3">⭐</p>
                                        <h3 className="font-semibold">No reviews yet</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Be the first to review this product!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                reviews.map((review) => (
                                    <Card key={review.review_id} className="border-0 shadow-sm">
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{review.buyer_name || "Customer"}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-saffron text-saffron" : "text-muted"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
