"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Package, Star, Clock, ArrowRight, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";

interface OrderItem {
    item_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
}

interface Order {
    order_id: string;
    buyer_id: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    shipping_status: string;
    shipping_address: Record<string, unknown>;
    created_at: string;
    items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
    not_shipped: "bg-gray-100 text-gray-800",
    processing: "bg-blue-100 text-blue-800",
};

export default function BuyerDashboard() {
    const { user, token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!token) { setLoading(false); return; }
            setLoading(true);
            try {
                const data = await api.getOrders(token) as Order[];
                setOrders(data || []);
            } catch (err) {
                console.error("Failed to load orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token]);

    const inTransit = orders.filter(o => o.shipping_status === "shipped" || o.shipping_status === "processing").length;

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-8 w-64 mb-8" />
                <div className="grid gap-4 sm:grid-cols-3 mb-8">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                    Welcome back, {user?.name || "Shopper"} 👋
                </h1>
                <p className="text-muted-foreground mt-1">Track your orders and manage your purchases</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
                {[
                    { icon: ShoppingBag, label: "Total Orders", value: String(orders.length), color: "from-terracotta/10 to-saffron/10" },
                    { icon: Package, label: "In Transit", value: String(inTransit), color: "from-blue-500/10 to-cyan-500/10" },
                    { icon: Star, label: "Completed", value: String(orders.filter(o => o.shipping_status === "delivered").length), color: "from-saffron/10 to-gold/10" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label} className="border-0 shadow-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                                <Icon className="h-5 w-5 text-terracotta" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-sm text-muted-foreground">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Orders */}
            <Tabs defaultValue="orders">
                <TabsList className="mb-6">
                    <TabsTrigger value="orders">My Orders</TabsTrigger>
                    <TabsTrigger value="custom">Custom Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                    {orders.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">🛍️</p>
                                <h3 className="font-semibold">No orders yet</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">Start exploring the marketplace to find unique handcrafted items!</p>
                                <Link href="/marketplace">
                                    <Button variant="outline" className="gap-1">
                                        Browse Marketplace <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <Card key={order.order_id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-mono text-sm text-muted-foreground">#{order.order_id.slice(0, 8)}</p>
                                                    <Badge className={`${STATUS_COLORS[order.payment_status] || ""} border-0 text-xs`}>
                                                        {order.payment_status}
                                                    </Badge>
                                                    <Badge className={`${STATUS_COLORS[order.shipping_status] || ""} border-0 text-xs`}>
                                                        <Truck className="mr-1 h-3 w-3" /> {order.shipping_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm">{order.items.length} item(s)</p>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold gradient-text">₹{order.total_amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="custom">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8 text-center">
                            <p className="text-3xl mb-3">✉️</p>
                            <h3 className="font-semibold mb-1">Custom Requests</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Want something unique? Send a custom order request to any artisan.
                            </p>
                            <Link href="/marketplace">
                                <Button variant="outline" className="gap-1">
                                    Browse Artisans <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
