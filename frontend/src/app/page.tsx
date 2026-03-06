"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Sparkles, Mic, Camera, Globe,
  Star, MapPin, ShoppingBag, Palette, Heart,
} from "lucide-react";

const CRAFT_CATEGORIES = [
  { name: "Pottery & Ceramics", emoji: "🏺", count: 234, color: "from-amber-500/20 to-orange-500/20" },
  { name: "Textiles & Weaving", emoji: "🧵", count: 512, color: "from-rose-500/20 to-pink-500/20" },
  { name: "Woodwork", emoji: "🪵", count: 189, color: "from-yellow-700/20 to-amber-700/20" },
  { name: "Metal Craft", emoji: "⚱️", count: 167, color: "from-slate-500/20 to-zinc-500/20" },
  { name: "Painting", emoji: "🎨", count: 298, color: "from-blue-500/20 to-indigo-500/20" },
  { name: "Jewelry", emoji: "💍", count: 345, color: "from-yellow-400/20 to-amber-400/20" },
];

const FEATURED_PRODUCTS = [
  { id: "1", title: "Blue Pottery Vase from Jaipur", price: 2499, artisan: "Rajan Kumar", state: "Rajasthan", image: "🏺", rating: 4.8 },
  { id: "2", title: "Banarasi Silk Saree", price: 15999, artisan: "Fatima Begum", state: "Uttar Pradesh", image: "🧵", rating: 4.9 },
  { id: "3", title: "Dokra Art Horse", price: 3200, artisan: "Sunil Mahato", state: "West Bengal", image: "🐴", rating: 4.7 },
  { id: "4", title: "Madhubani Painting", price: 4500, artisan: "Priya Devi", state: "Bihar", image: "🎨", rating: 4.9 },
];

const AI_FEATURES = [
  { icon: Camera, title: "Photo Upload", desc: "Simply photograph your craft — AI identifies the type, materials, and colors automatically." },
  { icon: Mic, title: "Voice Description", desc: "Describe your craft in any Indian language — AI transcribes and creates professional listings." },
  { icon: Sparkles, title: "AI Listing Generator", desc: "Get beautiful product descriptions, cultural stories, and SEO keywords — all generated instantly." },
  { icon: Globe, title: "Auto Translation", desc: "Listings automatically translated into Hindi, Tamil, Telugu, Bengali, and Marathi." },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 via-saffron/5 to-gold-light/10" />
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-saffron/10 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium border-saffron/20 bg-saffron/10 text-saffron-dark">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI-Powered Artisan Marketplace
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Where Ancient Craft Meets{" "}
              <span className="gradient-text">Modern Discovery</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Discover authentic handcrafted treasures from India&apos;s finest artisans.
              Every piece tells a story of heritage, skill, and cultural pride.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/marketplace">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-terracotta to-saffron hover:from-saffron-dark hover:to-terracotta text-white border-0 shadow-lg shadow-terracotta/20 px-8">
                  <ShoppingBag className="h-5 w-5" /> Explore Marketplace
                </Button>
              </Link>
              <Link href="/map">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <MapPin className="h-5 w-5" /> Discover by Region
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              {[
                { value: "5,000+", label: "Artisans" },
                { value: "28", label: "Indian States" },
                { value: "50+", label: "Craft Forms" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold gradient-text sm:text-3xl">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Craft Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
            Explore Craft Categories
          </h2>
          <p className="mt-3 text-muted-foreground">
            Browse through India&apos;s rich traditions of craftsmanship
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRAFT_CATEGORIES.map((cat) => (
            <Link key={cat.name} href={`/marketplace?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl transition-transform group-hover:scale-110`}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.count} products</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-terracotta" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>Featured Crafts</h2>
              <p className="mt-3 text-muted-foreground">Handpicked treasures from across India</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-1 text-terracotta hover:text-saffron-dark">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_PRODUCTS.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="relative aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                    <span className="text-6xl transition-transform group-hover:scale-110">{product.image}</span>
                    <button className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3.5 w-3.5 fill-saffron text-saffron" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                    <h3 className="font-semibold line-clamp-1 group-hover:text-terracotta transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {product.artisan} · {product.state}
                    </p>
                    <p className="mt-2 text-lg font-bold gradient-text">₹{product.price.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1 border-indigo/20 bg-indigo/5 text-indigo">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Powered by AI
          </Badge>
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
            AI Does the Heavy Lifting
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            Artisans simply upload a photo and record a voice note. Our AI handles everything else — listings, translations, SEO, and cultural stories.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FEATURES.map((feature, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo/10 to-indigo-light/10 transition-transform group-hover:scale-110">
                  <feature.icon className="h-6 w-6 text-indigo" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-terracotta via-saffron to-gold py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.08%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Are You an Artisan?
          </h2>
          <p className="mt-4 text-lg text-white/85 leading-relaxed">
            Join KalaKriti and reach millions of buyers worldwide. No digital skills needed — just your craft and a smartphone.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-white text-terracotta hover:bg-white/90 shadow-xl px-8">
              <Palette className="mr-2 h-5 w-5" /> Start Selling Today
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
