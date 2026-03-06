"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Package, IndianRupee, Star, Plus, Eye, Edit,
    BarChart3, TrendingUp, ArrowRight, ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Product {
    product_id: string;
    title: string;
    price: number;
    is_published: boolean;
    stock_quantity: number;
    category: string;
    image_url: string;
}

interface OrderItem {
    item_id: string;
    product_id: string;
    artisan_id: string;
    quantity: number;
    unit_price: number;
}

interface Order {
    order_id: string;
    buyer_id: string;
    total_amount: number;
    payment_status: string;
    shipping_status: string;
    created_at: string;
    items: OrderItem[];
}

export default function ArtisanDashboard() {
    const { user, token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setLoading(false); return; }
            setLoading(true);
            try {
                const [productsData, ordersData] = await Promise.allSettled([
                    api.getMyProducts(token),
                    api.getArtisanOrders(token),
                ]);
                if (productsData.status === "fulfilled") setProducts(productsData.value as Product[]);
                if (ordersData.status === "fulfilled") setOrders(ordersData.value as Order[]);
            } catch (err) {
                console.error("Failed to load dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const totalEarnings = orders
        .filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + o.total_amount, 0);

    const publishedCount = products.filter(p => p.is_published).length;

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                        Artisan Dashboard ✨
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your products, orders, and earnings</p>
                </div>
                <Link href="/artisan/products/new">
                    <Button className="gap-2 bg-gradient-to-r from-terracotta to-saffron text-white border-0 shadow-lg shadow-terracotta/20">
                        <Plus className="h-4 w-4" /> Upload New Product
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[
                    { icon: Package, label: "Products", value: String(products.length), trend: `${publishedCount} published`, gradient: "from-terracotta/10 to-saffron/10" },
                    { icon: ShoppingBag, label: "Orders", value: String(orders.length), trend: `${orders.filter(o => o.shipping_status === "processing").length} processing`, gradient: "from-blue-500/10 to-cyan-500/10" },
                    { icon: IndianRupee, label: "Earnings", value: `₹${totalEarnings.toLocaleString()}`, trend: "Total earned", gradient: "from-jade/10 to-emerald-500/10" },
                    { icon: Star, label: "Products", value: String(publishedCount), trend: "Published listings", gradient: "from-saffron/10 to-gold/10" },
                ].map(({ icon: Icon, label, value, trend, gradient }) => (
                    <Card key={label + value} className="border-0 shadow-sm hover:shadow-lg transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                                    <Icon className="h-5 w-5 text-terracotta" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-jade" />
                            </div>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label} · {trend}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="products">
                <TabsList className="mb-6">
                    <TabsTrigger value="products">My Products</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                    {products.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">🎨</p>
                                <h3 className="font-semibold">No products yet</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">Upload your first product to start selling!</p>
                                <Link href="/artisan/products/new">
                                    <Button className="gap-2 bg-gradient-to-r from-terracotta to-saffron text-white border-0">
                                        <Plus className="h-4 w-4" /> Upload Product
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {products.map((product) => (
                                <Card key={product.product_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-muted text-2xl overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                                            ) : "🏺"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">{product.title}</h3>
                                                <Badge variant={product.is_published ? "default" : "secondary"} className={`text-xs ${product.is_published ? "bg-jade/10 text-jade border-jade/20" : ""}`}>
                                                    {product.is_published ? "Published" : "Draft"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">₹{product.price.toLocaleString()}</span>
                                                <span>Stock: {product.stock_quantity}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/artisan/products/${product.product_id}/review`}>
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    <Edit className="h-3.5 w-3.5" /> Edit
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="orders">
                    {orders.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">📦</p>
                                <h3 className="font-semibold">No orders yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">Orders will appear here when buyers purchase your products.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <Card key={order.order_id} className="border-0 shadow-sm">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-mono text-sm text-muted-foreground">#{order.order_id.slice(0, 8)}</p>
                                            <p className="font-medium mt-0.5">{order.items.length} item(s)</p>
                                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold gradient-text">₹{order.total_amount.toLocaleString()}</p>
                                            <Badge variant="secondary" className="mt-1 text-xs">{order.shipping_status}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
