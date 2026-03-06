"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, Mic, MicOff, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Link from "next/link";

const CATEGORIES = [
    "Pottery & Ceramics", "Textiles & Weaving", "Woodwork", "Metal Craft",
    "Painting", "Jewelry", "Leather Craft", "Stone Carving", "Other",
];

export default function NewProductPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [imageUrl, setImageUrl] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [culturalStory, setCulturalStory] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [language, setLanguage] = useState("en");
    const [isRecording, setIsRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        try {
            setUploading(true);
            const ext = file.name.split(".").pop() || "jpg";
            const { upload_url, file_url } = await api.getPresignedUrl(token, "image", ext) as { upload_url: string; file_url: string };
            await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
            setImageUrl(file_url);
            toast.success("Image uploaded!");
        } catch (err) {
            toast.error("Image upload failed");
            // Fallback: use a local preview URL
            setImageUrl(URL.createObjectURL(file));
        } finally {
            setUploading(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            toast.info("Recording stopped. Audio will be processed by AI.");
            setIsRecording(false);
        } else {
            toast.info("Recording started... Tell us about your product!");
            setIsRecording(true);
        }
    };

    const handleSubmit = async () => {
        if (!token) { toast.error("Please sign in"); return; }
        if (!imageUrl) { toast.error("Please upload a product image"); return; }

        setUploading(true);
        try {
            const data = {
                title: title || undefined,
                description: description || undefined,
                cultural_story: culturalStory || undefined,
                price: price ? parseFloat(price) : undefined,
                category: category || undefined,
                tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
                image_url: imageUrl,
                audio_url: audioUrl || undefined,
                language,
            };
            const product = await api.uploadProduct(token, data) as { product_id: string };

            // If minimal data was provided, trigger AI generation
            if (!title && !description) {
                setGenerating(true);
                try {
                    await api.generateListing(token, product.product_id);
                    toast.success("AI is generating your listing!");
                } catch {
                    toast.info("Product created — you can generate AI listing from the review page.");
                }
                setGenerating(false);
            }

            toast.success("Product uploaded successfully!");
            router.push(`/artisan/products/${product.product_id}/review`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to upload product");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/artisan/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>

            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                Upload New Product ✨
            </h1>
            <p className="text-muted-foreground mb-8">
                Upload an image and optionally record a voice description. Our AI will generate a beautiful listing for you!
            </p>

            <div className="space-y-6">
                {/* Image Upload */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">Product Image *</h3>
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full aspect-square max-w-sm rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/20">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-center p-8">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP up to 10MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                            {uploading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Voice Recording */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">Voice Description (Optional)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Describe your product in your own words — speak in any language. Our AI will transcribe and use it to create the listing.
                        </p>
                        <Button
                            variant={isRecording ? "destructive" : "outline"}
                            className="gap-2 w-full sm:w-auto"
                            onClick={toggleRecording}
                        >
                            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Optional Details */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-1">Product Details (Optional)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Fill in what you know — AI will generate anything that&apos;s missing.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Title</label>
                                <Input placeholder="e.g. Blue Pottery Vase" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Price (₹)</label>
                                <Input type="number" placeholder="e.g. 2499" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <Textarea placeholder="Briefly describe your product..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Cultural Story</label>
                                <Textarea placeholder="Share the story behind this craft..." value={culturalStory} onChange={(e) => setCulturalStory(e.target.value)} rows={3} />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
                                <Input placeholder="e.g. pottery, jaipur, handmade" value={tags} onChange={(e) => setTags(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Language</label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="hi">Hindi</SelectItem>
                                        <SelectItem value="ta">Tamil</SelectItem>
                                        <SelectItem value="te">Telugu</SelectItem>
                                        <SelectItem value="bn">Bengali</SelectItem>
                                        <SelectItem value="mr">Marathi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex gap-3">
                    <Button
                        size="lg"
                        className="flex-1 gap-2 bg-gradient-to-r from-terracotta to-saffron hover:from-saffron-dark hover:to-terracotta text-white border-0 shadow-lg shadow-terracotta/20"
                        onClick={handleSubmit}
                        disabled={!imageUrl || uploading || generating}
                    >
                        {generating ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> AI is generating...</>
                        ) : (
                            <><Sparkles className="h-5 w-5" /> Upload & Generate AI Listing</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
