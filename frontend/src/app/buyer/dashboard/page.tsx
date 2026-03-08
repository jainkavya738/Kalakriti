"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BuyerDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
            router.push("/auth");
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === "artisan") {
            router.push("/artisan/dashboard");
            return;
        }

        setUser(parsedUser);

        // Fetch Buyer Orders
        const fetchOrders = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${baseUrl}/api/orders/buyer/${parsedUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (error) {
                console.error("Failed to load buyer orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-card border-b border-border pt-12 pb-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">My Orders</h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage your purchase history.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">
                            🛍️
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                            You haven't placed any orders yet. Discover unique handcrafted items in our marketplace.
                        </p>
                        <Button onClick={() => router.push("/marketplace")} className="rounded-full gradient-saffron text-white border-0 hover:opacity-90">
                            Explore Marketplace
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            // Order items join returns individual items. If multiple, we show the first one here.
                            const item = order.order_items?.[0];
                            const product = item?.products;

                            return (
                                <div
                                    key={order.order_id || order.id}
                                    className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            {product?.image_url ? (
                                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted flex-shrink-0">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.title || "Product"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg flex-shrink-0">
                                                    #{(order.order_id || order.id || "").slice(0, 4).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-base line-clamp-1">
                                                    {product?.title || "Unknown Product"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    Order ID: {(order.order_id || order.id).split('-')[0]} • {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-lg text-primary">
                                                ₹{order.total_amount?.toLocaleString("en-IN") || order.amount?.toLocaleString("en-IN") || 0}
                                            </p>
                                            <Badge variant={order.payment_status === "pending" || order.status === "pending" ? "secondary" : "default"} className="mt-1 capitalize">
                                                {order.payment_status || order.status || "Pending"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Shipping details toggle or display */}
                                    <div className="pt-4 mt-2 border-t border-border flex justify-between items-center bg-muted/20 p-4 rounded-lg">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shipping To</p>
                                            <p className="text-sm font-medium">{order.shipping_address?.name || order.buyer_name}</p>
                                            <p className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-md">{order.shipping_address?.message || order.message || "No address provided"}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => router.push(`/product/${item?.product_id || order.product_id}`)}
                                        >
                                            View Product
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
