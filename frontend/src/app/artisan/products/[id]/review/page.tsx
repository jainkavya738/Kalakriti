"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Check, Edit3, Eye, Globe, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";

interface Product {
    product_id: string;
    title: string;
    description: string;
    cultural_story?: string;
    price: number;
    currency: string;
    category: string;
    tags: string[];
    seo_keywords: string[];
    image_url: string;
    is_published: boolean;
    ai_generated: boolean;
    stock_quantity: number;
}

export default function ReviewProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const { token } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Editable fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [culturalStory, setCulturalStory] = useState("");
    const [priceVal, setPriceVal] = useState("");
    const [stockQuantity, setStockQuantity] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await api.getProduct(productId) as Product;
                setProduct(data);
                setTitle(data.title);
                setDescription(data.description);
                setCulturalStory(data.cultural_story || "");
                setPriceVal(String(data.price));
                setStockQuantity(String(data.stock_quantity));
            } catch (err) {
                toast.error("Product not found");
                router.push("/artisan/dashboard");
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId, router]);

    const handleSave = async () => {
        if (!token || !product) return;
        try {
            const updated = await api.updateProduct(token, product.product_id, {
                title,
                description,
                cultural_story: culturalStory || undefined,
                price: parseFloat(priceVal) || product.price,
                stock_quantity: parseInt(stockQuantity) || product.stock_quantity,
            }) as Product;
            setProduct(updated);
            setEditing(false);
            toast.success("Product updated!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        }
    };

    const handlePublish = async () => {
        if (!token || !product) return;
        setPublishing(true);
        try {
            const updated = await api.publishProduct(token, product.product_id) as Product;
            setProduct(updated);
            toast.success("Product published to marketplace! 🎉");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to publish");
        } finally {
            setPublishing(false);
        }
    };

    const handleRegenerate = async () => {
        if (!token || !product) return;
        setRegenerating(true);
        try {
            await api.generateListing(token, product.product_id);
            toast.success("AI is regenerating your listing. Refresh in a moment.");
            // Re-fetch after a delay
            setTimeout(async () => {
                try {
                    const data = await api.getProduct(productId) as Product;
                    setProduct(data);
                    setTitle(data.title);
                    setDescription(data.description);
                    setCulturalStory(data.cultural_story || "");
                } catch { /* ignore */ }
                setRegenerating(false);
            }, 3000);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to regenerate");
            setRegenerating(false);
        }
    };

    const handleTranslate = async () => {
        if (!token || !product) return;
        setTranslating(true);
        try {
            await api.translateProduct(token, product.product_id);
            toast.success("Translations generated successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to translate");
        } finally {
            setTranslating(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-8 w-64 mb-8" />
                <Skeleton className="h-48 rounded-xl mb-6" />
                <Skeleton className="h-48 rounded-xl" />
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/artisan/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                        Review Listing
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and edit your AI-generated listing before publishing</p>
                </div>
                <div className="flex items-center gap-2">
                    {product.ai_generated && (
                        <Badge className="bg-gradient-to-r from-terracotta/10 to-saffron/10 text-terracotta border-terracotta/20 gap-1">
                            <Sparkles className="h-3 w-3" /> AI generated
                        </Badge>
                    )}
                    <Badge variant={product.is_published ? "default" : "secondary"} className={product.is_published ? "bg-jade/10 text-jade border-jade/20" : ""}>
                        {product.is_published ? "Published" : "Draft"}
                    </Badge>
                </div>
            </div>

            {/* Product Image Preview */}
            <Card className="border-0 shadow-sm mb-6 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-6xl">🏺</span>
                    )}
                </div>
            </Card>

            {/* Listing Content */}
            <Card className="border-0 shadow-sm mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Listing Details</h3>
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditing(!editing)}>
                            {editing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                            {editing ? "Preview" : "Edit"}
                        </Button>
                    </div>

                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Title</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Cultural Story</label>
                                <Textarea value={culturalStory} onChange={(e) => setCulturalStory(e.target.value)} rows={4} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Price (₹)</label>
                                    <Input type="number" value={priceVal} onChange={(e) => setPriceVal(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Stock</label>
                                    <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
                                </div>
                            </div>
                            <Button onClick={handleSave} className="gap-1 bg-gradient-to-r from-terracotta to-saffron text-white border-0">
                                <Check className="h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{product.title}</h2>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                            </div>
                            {product.cultural_story && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cultural Story</p>
                                    <p className="text-muted-foreground leading-relaxed">{product.cultural_story}</p>
                                </div>
                            )}
                            <Separator />
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Price</p>
                                    <p className="text-2xl font-bold gradient-text">₹{product.price.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                                    <p className="font-medium">{product.category}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Stock</p>
                                    <p className="font-medium">{product.stock_quantity}</p>
                                </div>
                            </div>
                            {product.tags.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {product.seo_keywords.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">SEO Keywords</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.seo_keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {!product.is_published && (
                    <Button
                        size="lg"
                        className="flex-1 gap-2 bg-gradient-to-r from-jade to-emerald-500 hover:from-emerald-600 hover:to-jade text-white border-0 shadow-lg shadow-jade/20"
                        onClick={handlePublish}
                        disabled={publishing}
                    >
                        {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                        Publish to Marketplace
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                >
                    {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Regenerate AI
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleTranslate}
                    disabled={translating}
                >
                    {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Translate
                </Button>
            </div>
        </div>
    );
}
