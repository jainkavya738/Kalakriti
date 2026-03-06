"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Star } from "lucide-react";

const STATES_DATA: Record<string, { crafts: string[]; products: number; color: string }> = {
    "Rajasthan": { crafts: ["Blue Pottery", "Block Printing", "Lac Bangles"], products: 512, color: "from-amber-500 to-orange-500" },
    "Uttar Pradesh": { crafts: ["Chikankari", "Banarasi Silk", "Brass Work"], products: 423, color: "from-rose-500 to-pink-500" },
    "West Bengal": { crafts: ["Dokra Art", "Kantha Embroidery", "Terracotta"], products: 345, color: "from-emerald-500 to-green-500" },
    "Gujarat": { crafts: ["Bandhani", "Rogan Art", "Patola Silk"], products: 289, color: "from-red-500 to-orange-500" },
    "Kashmir": { crafts: ["Pashmina Shawls", "Paper Mache", "Walnut Wood"], products: 267, color: "from-blue-500 to-cyan-500" },
    "Tamil Nadu": { crafts: ["Tanjore Painting", "Bronze Casting", "Silk Weaving"], products: 234, color: "from-purple-500 to-violet-500" },
    "Bihar": { crafts: ["Madhubani Painting", "Sujni Embroidery", "Tikuli Art"], products: 198, color: "from-yellow-500 to-amber-500" },
    "Odisha": { crafts: ["Pattachitra", "Dhokra Casting", "Stone Carving"], products: 187, color: "from-teal-500 to-emerald-500" },
    "Karnataka": { crafts: ["Mysore Painting", "Sandalwood Carving", "Bidriware"], products: 176, color: "from-indigo-500 to-blue-500" },
    "Madhya Pradesh": { crafts: ["Bagh Print", "Gond Art", "Chanderi Weaving"], products: 156, color: "from-lime-500 to-green-500" },
    "Kerala": { crafts: ["Coir Craft", "Mural Painting", "Bell Metal"], products: 145, color: "from-cyan-500 to-teal-500" },
    "Andhra Pradesh": { crafts: ["Kalamkari", "Kondapalli Toys", "Etikoppaka"], products: 134, color: "from-orange-500 to-red-500" },
};

export default function CraftMapPage() {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <Badge variant="secondary" className="mb-4 border-terracotta/20 bg-terracotta/5 text-terracotta">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" /> Interactive Craft Map
                </Badge>
                <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
                    Discover India&apos;s <span className="gradient-text">Craft Heritage</span>
                </h1>
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                    Explore the rich diversity of Indian handicrafts. Click on any state to discover its unique craft traditions.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Map (State Cards Grid) */}
                <div className="lg:col-span-2">
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {Object.entries(STATES_DATA).map(([state, data]) => (
                            <button
                                key={state}
                                onClick={() => setSelectedState(state === selectedState ? null : state)}
                                className={`group rounded-xl border-2 p-4 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${selectedState === state
                                        ? "border-terracotta bg-terracotta/5 shadow-lg -translate-y-1"
                                        : "border-border hover:border-saffron/30"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${data.color} text-white text-xs font-bold`}>
                                        {state.slice(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="font-semibold text-sm">{state}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">{data.products} products</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {data.crafts.slice(0, 2).map((c) => (
                                        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">{c}</Badge>
                                    ))}
                                    {data.crafts.length > 2 && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{data.crafts.length - 2}</Badge>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-1">
                    {selectedState ? (
                        <Card className="border-0 shadow-lg sticky top-24 animate-in slide-in-from-right-4">
                            <div className={`h-2 rounded-t-lg bg-gradient-to-r ${STATES_DATA[selectedState].color}`} />
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="h-5 w-5 text-terracotta" />
                                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{selectedState}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Famous Crafts</p>
                                        <div className="space-y-2">
                                            {STATES_DATA[selectedState].crafts.map((craft) => (
                                                <Link key={craft} href={`/marketplace?search=${encodeURIComponent(craft)}`}>
                                                    <div className="flex items-center justify-between rounded-lg p-2.5 hover:bg-secondary transition-colors cursor-pointer group">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">🎨</span>
                                                            <span className="text-sm font-medium">{craft}</span>
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-1 group-hover:text-terracotta transition-all" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-secondary/50 p-4">
                                        <p className="text-2xl font-bold gradient-text">{STATES_DATA[selectedState].products}</p>
                                        <p className="text-sm text-muted-foreground">Products available</p>
                                    </div>

                                    <Link href={`/marketplace?state=${encodeURIComponent(selectedState)}`}>
                                        <Button className="w-full bg-gradient-to-r from-terracotta to-saffron text-white border-0 gap-2">
                                            Browse {selectedState} Crafts <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-8 text-center">
                                <div className="text-4xl mb-4">🗺️</div>
                                <h3 className="font-semibold mb-2">Select a State</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click on any state to explore its unique craft heritage and discover artisan products.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
