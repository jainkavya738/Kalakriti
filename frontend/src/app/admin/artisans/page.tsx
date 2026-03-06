"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle2, XCircle, AlertTriangle, MapPin, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Artisan {
    artisan_id: string;
    user_id: string;
    craft_type: string;
    bio?: string;
    state?: string;
    city?: string;
    verification_status: string;
    created_at: string;
}

interface FlaggedProduct {
    product_id: string;
    title: string;
    artisan_id: string;
    category: string;
    is_flagged: boolean;
}

export default function AdminArtisansPage() {
    const { token } = useAuth();
    const [artisans, setArtisans] = useState<Artisan[]>([]);
    const [flaggedProducts, setFlaggedProducts] = useState<FlaggedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setLoading(false); return; }
            setLoading(true);
            try {
                const [artisansData, flaggedData] = await Promise.allSettled([
                    api.getPendingArtisans(token),
                    api.getFlaggedProducts(token),
                ]);
                if (artisansData.status === "fulfilled") setArtisans(artisansData.value as Artisan[]);
                if (flaggedData.status === "fulfilled") setFlaggedProducts(flaggedData.value as FlaggedProduct[]);
            } catch (err) {
                console.error("Failed to load admin data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleVerify = async (artisanId: string, status: "verified" | "rejected") => {
        if (!token) return;
        try {
            await api.verifyArtisan(token, artisanId, { verification_status: status });
            setArtisans(prev => prev.filter(a => a.artisan_id !== artisanId));
            toast.success(`Artisan ${status === "verified" ? "approved" : "rejected"} successfully`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update artisan");
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-8 w-64 mb-8" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                    Admin Panel 🛡️
                </h1>
                <p className="text-muted-foreground mt-1">Manage artisan verifications and flagged content</p>
            </div>

            <Tabs defaultValue="artisans">
                <TabsList className="mb-6">
                    <TabsTrigger value="artisans" className="gap-1.5">
                        <Shield className="h-4 w-4" /> Pending Artisans ({artisans.length})
                    </TabsTrigger>
                    <TabsTrigger value="flagged" className="gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Flagged Products ({flaggedProducts.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="artisans">
                    {artisans.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">✅</p>
                                <h3 className="font-semibold">All caught up!</h3>
                                <p className="text-sm text-muted-foreground mt-1">No artisans pending verification.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {artisans.map((artisan) => (
                                <Card key={artisan.artisan_id} className="border-0 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-saffron/20 to-terracotta/20 text-2xl">
                                                    👨‍🎨
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">Artisan #{artisan.artisan_id.slice(0, 8)}</p>
                                                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-0">
                                                            Pending
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Award className="h-3 w-3" /> {artisan.craft_type}
                                                    </p>
                                                    {(artisan.city || artisan.state) && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {artisan.city}{artisan.city && artisan.state ? ", " : ""}{artisan.state}
                                                        </p>
                                                    )}
                                                    {artisan.bio && (
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artisan.bio}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="gap-1 bg-jade text-white hover:bg-jade/90"
                                                    onClick={() => handleVerify(artisan.artisan_id, "verified")}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="gap-1"
                                                    onClick={() => handleVerify(artisan.artisan_id, "rejected")}
                                                >
                                                    <XCircle className="h-4 w-4" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="flagged">
                    {flaggedProducts.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <p className="text-3xl mb-3">✅</p>
                                <h3 className="font-semibold">No flagged products</h3>
                                <p className="text-sm text-muted-foreground mt-1">All products look authentic!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {flaggedProducts.map((product) => (
                                <Card key={product.product_id} className="border-0 shadow-sm border-l-4 border-l-red-400">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-semibold">{product.title}</p>
                                            <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                                        </div>
                                        <Badge variant="destructive" className="text-xs">
                                            <AlertTriangle className="mr-1 h-3 w-3" /> Flagged
                                        </Badge>
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
