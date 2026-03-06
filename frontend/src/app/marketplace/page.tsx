"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Star, Heart, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORIES = [
    "All", "Pottery & Ceramics", "Textiles & Weaving", "Woodwork",
    "Metal Craft", "Painting", "Jewelry", "Leather Craft", "Stone Carving",
];

const STATES = [
    "All States", "Rajasthan", "Uttar Pradesh", "West Bengal", "Bihar",
    "Gujarat", "Tamil Nadu", "Karnataka", "Kashmir", "Madhya Pradesh",
    "Odisha", "Andhra Pradesh", "Kerala",
];

const EMOJIS: Record<string, string> = {
    "Pottery & Ceramics": "🏺", "Textiles & Weaving": "🧵", "Woodwork": "🪵",
    "Metal Craft": "⚱️", "Painting": "🎨", "Jewelry": "💍",
    "Leather Craft": "👜", "Stone Carving": "🗿",
};

interface Product {
    product_id: string;
    title: string;
    price: number;
    category: string;
    image_url: string;
    tags: string[];
    artisan_id: string;
    description: string;
    stock_quantity: number;
    currency: string;
    is_published: boolean;
    is_available: boolean;
}

export default function MarketplacePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [state, setState] = useState("All States");
    const [priceSort, setPriceSort] = useState("relevance");
    const [showFilters, setShowFilters] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category !== "All") params.set("category", category);
            if (state !== "All States") params.set("state", state);
            if (search) params.set("search", search);
            params.set("page", String(page));
            params.set("page_size", String(pageSize));
            const data = await api.getProducts(params) as { products: Product[]; total: number; page: number; page_size: number };
            setProducts(data.products || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Failed to load products:", err);
            setProducts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [category, state, search, page, pageSize]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [category, state, search]);

    const sorted = [...products].sort((a, b) => {
        if (priceSort === "low-high") return a.price - b.price;
        if (priceSort === "high-low") return b.price - a.price;
        return 0;
    });

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>Marketplace</h1>
                <p className="mt-2 text-muted-foreground">Discover authentic handcrafted treasures from across India</p>
            </div>

            {/* Search & Filters */}
            <div className="mb-8 space-y-4">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search for crafts, artisans, or regions..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 md:hidden"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                </div>

                <div className={`flex flex-wrap gap-3 ${showFilters ? "" : "hidden md:flex"}`}>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={priceSort} onValueChange={setPriceSort}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="low-high">Price: Low → High</SelectItem>
                            <SelectItem value="high-low">Price: High → Low</SelectItem>
                        </SelectContent>
                    </Select>

                    {(category !== "All" || state !== "All States" || search) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => { setCategory("All"); setState("All States"); setSearch(""); }}
                        >
                            <X className="h-3.5 w-3.5" /> Clear filters
                        </Button>
                    )}
                </div>

                {/* Active filter badges */}
                {category !== "All" && (
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="gap-1">
                            {category}
                            <button onClick={() => setCategory("All")}><X className="h-3 w-3" /></button>
                        </Badge>
                    </div>
                )}
            </div>

            {/* Results count */}
            <p className="mb-4 text-sm text-muted-foreground">{total} products found</p>

            {/* Product Grid */}
            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-0 shadow-sm">
                            <Skeleton className="aspect-square w-full" />
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-5 w-1/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sorted.map((product) => (
                        <Link key={product.product_id} href={`/products/${product.product_id}`}>
                            <Card className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="relative aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <span className="text-5xl transition-transform group-hover:scale-110">
                                            {EMOJIS[product.category] || "🎨"}
                                        </span>
                                    )}
                                    <button
                                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <Heart className="h-4 w-4" />
                                    </button>
                                    <Badge className="absolute bottom-3 left-3 bg-white/80 text-foreground backdrop-blur-sm border-0 text-xs">
                                        {product.category}
                                    </Badge>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold line-clamp-2 group-hover:text-terracotta transition-colors min-h-[2.5rem]">
                                        {product.title}
                                    </h3>
                                    <p className="mt-3 text-lg font-bold gradient-text">₹{product.price.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {sorted.length === 0 && !loading && (
                <div className="py-20 text-center">
                    <p className="text-4xl mb-4">🔍</p>
                    <h3 className="text-lg font-semibold">No products found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your filters or search query</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
