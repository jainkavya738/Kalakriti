"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Product detail page — shows image, description, cultural story,
 * artisan profile, and a "Place Order" button.
 * - Static fallback data for homepage featured showcase crafts (IDs 1-6)
 * - Live backend fetch for marketplace products (UUID IDs)
 */

// ─── Static showcase data for homepage featured crafts ───────────────────────
const staticProducts: Record<string, any> = {
    "1": {
        id: "1",
        title: "Hand-Painted Blue Pottery Vase",
        price: 2800,
        image_url:
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&h=1100&fit=crop",
        category: "Pottery",
        description:
            "This exquisite Hand-Painted Blue Pottery Vase comes from the royal city of Jaipur, Rajasthan. Crafted using traditional Kashi work techniques, each vase is hand-thrown on a clay wheel and painted with mineral-based blue cobalt hues over a quartz-rich white base. The intricate floral and geometric patterns are drawn freehand by master artisans who have honed their skills over decades. Blue Pottery is a UNESCO-recognized craft form unique to Rajasthan, distinguished by its vibrant blue dye, soft texture, and translucent quality.",
        cultural_story:
            "Blue Pottery traces its roots to 14th-century Mongol art that evolved in Persia and later flourished under the Mughal Empire in India. The craft found its home in Jaipur where royal patronage helped it thrive. Today, artisans like Raju Kumar keep this dying art alive, one brushstroke at a time.",
        tags: ["Blue Pottery", "Jaipur", "Rajasthan", "Home Decor", "Handcrafted"],
        artisans: {
            name: "Raju Kumar",
            location: "Jaipur, Rajasthan",
            bio: "Third-generation Blue Pottery artisan with over 25 years of experience.",
        },
    },
    "2": {
        id: "2",
        title: "Banarasi Silk Saree — Gold Zari",
        price: 8500,
        image_url:
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&h=1100&fit=crop",
        category: "Textiles",
        description:
            "Woven with real gold Zari thread by master weavers in Varanasi, this saree features a rich brocade design with intricate floral motifs and paisleys woven directly into the silk fabric on a traditional handloom. Each saree takes 15–30 days to complete. Banarasi sarees are GI-tagged and are considered among the finest in the world.",
        cultural_story:
            "Banarasi silk originated 2,000 years ago in Varanasi and reached its zenith during the Mughal period, when Persian influence introduced intricate floral and arabesque designs. Today, a Banarasi saree is an essential part of every Indian bride's trousseau.",
        tags: ["Banarasi", "Silk", "Zari", "Varanasi", "Bridal Wear", "GI Tagged"],
        artisans: {
            name: "Meera Devi",
            location: "Varanasi, Uttar Pradesh",
            bio: "Fourth-generation weaver and advocate for fair wages in the weaving community.",
        },
    },
    "3": {
        id: "3",
        title: "Dhokra Brass Dancing Figure",
        price: 3200,
        image_url:
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&h=1100&fit=crop",
        category: "Metal Craft",
        description:
            "Created using the ancient lost-wax casting (Cire Perdue) technique, this brass figure depicts a traditional dancer in a graceful pose. Each piece is unique — the process involves sculpting in wax, encasing in clay, and pouring molten brass. The raw, earthy texture gives it a primitive yet sophisticated appeal prized by collectors worldwide.",
        cultural_story:
            "Dhokra craft has a history of over 4,000 years, tracing its origins to the Indus Valley Civilization. The iconic 'Dancing Girl' of Mohenjo-Daro is one of the earliest examples of this technique. Today it is a GI-protected craft practiced by tribal artisans in Chhattisgarh and West Bengal.",
        tags: ["Dhokra", "Brass", "Metal Craft", "Chhattisgarh", "Tribal Art"],
        artisans: {
            name: "Sunil Gond",
            location: "Bastar, Chhattisgarh",
            bio: "Dhokra craftsman from the Gond tribe, featured in national exhibitions.",
        },
    },
    "4": {
        id: "4",
        title: "Madhubani Art — Tree of Life",
        price: 4500,
        image_url:
            "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=900&h=1100&fit=crop",
        category: "Painting",
        description:
            "This Madhubani painting depicts the sacred 'Tree of Life' on handmade Mithila paper using natural plant and mineral pigments. The Bharni style features bold outlines filled with vibrant colors, with symbolic imagery of birds, fish, and blooming flowers. No two paintings are alike — each is a true original.",
        cultural_story:
            "Madhubani painting originated in the Mithila region of Bihar over 2,500 years ago. Women traditionally painted these on home walls during festivals and weddings to invite prosperity. The art carries a GI tag and has been exhibited at international galleries and UNESCO heritage events.",
        tags: ["Madhubani", "Mithila Art", "Bihar", "Natural Colors", "GI Tagged", "Folk Art"],
        artisans: {
            name: "Lakshmi Kumari",
            location: "Madhubani, Bihar",
            bio: "National Award-winning artist who trains women in traditional Madhubani painting using natural dyes.",
        },
    },
    "5": {
        id: "5",
        title: "Kashmiri Papier-Mâché Box",
        price: 1800,
        image_url:
            "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=900&h=1100&fit=crop",
        category: "Paper Craft",
        description:
            "A labor of love taking up to 10 days to complete — made from recycled paper pulp, hand-painted with fine brushes in jewel tones (ruby reds, cobalt blues, and gold) depicting Kashmir's iconic chinar leaves, flowers, and birds. Finished with multiple lacquer layers for a glossy, durable sheen.",
        cultural_story:
            "Papier-Mâché was introduced to Kashmir by the Sufi saint Shah-e-Hamadan in the 14th century. The craft absorbed Persian and Mughal aesthetics over centuries, nearly disappearing post-1990, but has since been revived by artisan cooperatives dedicated to preserving Kashmiri heritage.",
        tags: ["Kashmir", "Papier-Mâché", "Paper Craft", "Hand-Painted", "Gift"],
        artisans: {
            name: "Abdul Rashid",
            location: "Srinagar, Kashmir",
            bio: "Fourth-generation Papier-Mâché master with 30 years of experience in the delicate Kashmir painting tradition.",
        },
    },
    "6": {
        id: "6",
        title: "Chikankari Embroidered Kurta",
        price: 3600,
        image_url:
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&h=1100&fit=crop",
        category: "Textiles",
        description:
            "Handcrafted in Lucknow using over 30 traditional white-thread embroidery stitches on soft cotton — including shadow work (tepchi), satin stitch (murri), and the signature net stitch (jali). The graceful floral lattice across the chest and hem is a testament to refined Awadhi craftsmanship.",
        cultural_story:
            "Chikankari is believed to have been introduced by Empress Noor Jahan in the 17th century and flourished under the nawabs of Awadh. Lucknow became its undisputed center and today the craft employs over 2.5 lakh artisans, mostly women. It holds a GI tag.",
        tags: ["Chikankari", "Lucknow", "Embroidery", "Cotton", "GI Tagged"],
        artisans: {
            name: "Noor Jahan",
            location: "Lucknow, Uttar Pradesh",
            bio: "Master Chikankari artisan of 35 years, running a cooperative of 40 women artisans for fair wages.",
        },
    },
};

// ─── Order Modal ─────────────────────────────────────────────────────────────
function OrderModal({
    product,
    user,
    onClose,
    onSuccess,
}: {
    product: any;
    user: any;
    onClose: () => void;
    onSuccess: (orderId: string) => void;
}) {
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        address: "",
        message: "",
    });
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.phone || !form.address) {
            setError("Please fill in all required fields.");
            return;
        }
        setPlacing(true);
        setError("");
        try {
            // For static showcase products, skip backend API call
            if (staticProducts[product.id]) {
                await new Promise((r) => setTimeout(r, 800)); // simulate delay
                onSuccess(`DEMO-${Date.now()}`);
                return;
            }
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${baseUrl}/api/orders/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: product.product_id || product.id,
                    buyer_id: user?.id || null,
                    buyer_name: form.name,
                    buyer_email: form.email,
                    buyer_phone: form.phone,
                    message: form.address + (form.message ? ` | ${form.message}` : ""),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess(data.order_id);
            } else {
                throw new Error(data.detail || "Failed to place order.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="gradient-saffron px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">Place Your Order</h2>
                        <p className="text-white/80 text-sm truncate max-w-xs">{product.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Price summary */}
                <div className="px-6 py-3 bg-accent/40 border-b border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order Total</span>
                    <span className="text-xl font-extrabold text-gradient">
                        ₹{product.price?.toLocaleString("en-IN")}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Full Name *
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Email Address *
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Phone Number *
                            </label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Delivery Address *
                            </label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange as any}
                                rows={2}
                                placeholder="House/Flat No., Street, City, State, PIN"
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                Message to Artisan (optional)
                            </label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange as any}
                                rows={2}
                                placeholder="Any special requests or notes..."
                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                        🔒 No payment is charged now. The artisan will contact you to confirm delivery. Payment
                        gateway will be integrated soon.
                    </p>

                    <Button
                        type="submit"
                        disabled={placing}
                        className="w-full rounded-full gradient-saffron text-white border-0 font-semibold hover:opacity-90 transition-opacity py-3"
                    >
                        {placing ? "Placing Order..." : "✓ Confirm Order — Free"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function OrderSuccess({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl text-center px-8 py-10">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-extrabold mb-2">Order Placed!</h2>
                <p className="text-muted-foreground text-sm mb-4">
                    Your order has been received. The artisan will contact you shortly to confirm delivery
                    details.
                </p>
                <div className="bg-accent/50 rounded-xl px-4 py-2 mb-6 text-xs text-muted-foreground font-mono break-all">
                    Order ID: {orderId}
                </div>
                <Button
                    onClick={onClose}
                    className="rounded-full gradient-saffron text-white border-0 font-semibold hover:opacity-90 px-8"
                >
                    Continue Shopping
                </Button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id as string;

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch { }
        }

        const load = async () => {
            // 1. Check static showcase data first
            if (staticProducts[productId]) {
                setProduct(staticProducts[productId]);
                setLoading(false);
                return;
            }

            // 2. Fetch from backend API
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${baseUrl}/api/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data.product);
                } else {
                    // product not found → go back to marketplace
                    router.push("/marketplace");
                }
            } catch {
                router.push("/marketplace");
            } finally {
                setLoading(false);
            }
        };

        if (productId) load();
    }, [productId, router]);

    const handleOrderSuccess = (id: string) => {
        setShowOrderModal(false);
        setOrderId(id);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) return null;

    // Normalise description: backend uses `description`, static uses `description` too now
    const description =
        product.full_description || product.description || product.short_description || "";
    const artisanName = product.artisans?.name || "Unknown Artisan";

    return (
        <>
            {/* Modals */}
            {showOrderModal && (
                <OrderModal
                    product={product}
                    user={user}
                    onClose={() => setShowOrderModal(false)}
                    onSuccess={handleOrderSuccess}
                />
            )}
            {orderId && (
                <OrderSuccess
                    orderId={orderId}
                    onClose={() => {
                        setOrderId(null);
                        router.push("/marketplace");
                    }}
                />
            )}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl overflow-hidden p-6 text-center">
                        <div className="w-16 h-16 rounded-full gradient-saffron flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl font-bold">{artisanName[0]}</span>
                        </div>
                        <h2 className="text-xl font-bold mb-1">{artisanName}</h2>
                        <p className="text-sm text-muted-foreground mb-6">Artisan Contact Details</p>

                        <div className="space-y-4 mb-8 text-left">
                            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 flex items-center gap-3">
                                <span className="text-xl">📧</span>
                                <div className="min-w-0">
                                    <p className="text-xs text-orange-800 font-semibold mb-0.5">Email Address</p>
                                    <p className="text-sm font-medium truncate">{product.artisans?.email || "Not provided"}</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowContactModal(false)}
                            className="w-full rounded-full"
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
                        <span>/</span>
                        <span className="text-foreground line-clamp-1">{product.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* ── Image ── */}
                        <div>
                            <div className="rounded-2xl overflow-hidden border border-border bg-muted aspect-[4/5]">
                                <img
                                    src={
                                        product.image_url ||
                                        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900&h=1100&fit=crop"
                                    }
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* ── Details ── */}
                        <div className="flex flex-col">
                            <Badge variant="secondary" className="w-fit mb-3 text-xs">
                                {product.category || "Handcraft"}
                            </Badge>

                            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{product.title}</h1>

                            {/* Price + Place Order */}
                            <div className="mt-5 flex items-center gap-4 flex-wrap">
                                <span className="text-3xl font-extrabold text-gradient">
                                    ₹{product.price ? product.price.toLocaleString("en-IN") : "0"}
                                </span>
                                <span className="text-sm text-muted-foreground">incl. all taxes</span>
                            </div>

                            {/* ── PLACE ORDER BUTTON ── */}
                            <div className="mt-6">
                                {user?.role === "artisan" ? (
                                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                                        <span className="font-semibold">Note:</span> Artisans cannot place orders.
                                        Log in as a Buyer to purchase.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            size="lg"
                                            onClick={() => {
                                                if (!user) { router.push("/auth"); return; }
                                                setShowOrderModal(true);
                                            }}
                                            className="rounded-full gradient-saffron text-white border-0 px-10 font-semibold hover:opacity-90 transition-opacity text-base animate-pulse-glow"
                                        >
                                            {user ? "🛒 Place Order" : "Log in to Order"}
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => setShowContactModal(true)}
                                            className="rounded-full px-8 font-semibold"
                                        >
                                            Contact Artisan
                                        </Button>
                                    </div>
                                )}
                                {!user && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        <Link href="/auth" className="underline hover:text-foreground">Sign in</Link> to place an order.
                                    </p>
                                )}
                            </div>

                            <Separator className="my-6" />

                            {/* Description */}
                            {description && (
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                        About this Craft
                                    </h2>
                                    <p className="text-foreground/80 leading-relaxed text-[15px]">{description}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {product.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Cultural Story */}
                            {product.cultural_story && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="p-5 rounded-xl bg-accent/50 border border-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">📖</span>
                                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                                Cultural Story
                                            </h2>
                                        </div>
                                        <p className="text-foreground/80 leading-relaxed text-sm">
                                            {product.cultural_story}
                                        </p>
                                    </div>
                                </>
                            )}

                            <Separator className="my-6" />

                            {/* Artisan profile */}
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-full gradient-saffron flex items-center justify-center shrink-0">
                                    <span className="text-white text-xl font-bold">{artisanName[0]}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{artisanName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {product.artisans?.location || "India"}
                                    </p>
                                    {product.artisans?.bio && (
                                        <p className="text-sm text-foreground/70 mt-1 leading-relaxed">
                                            {product.artisans.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer note */}
                            <p className="mt-6 text-xs text-muted-foreground">
                                🔒 No payment is charged at this stage — payment gateway will be integrated soon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
