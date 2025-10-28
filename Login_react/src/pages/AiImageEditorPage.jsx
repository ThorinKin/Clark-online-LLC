// Login_react/src/pages/AiImageEditorPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, X, Wand2, Loader2, Sparkles, AlertTriangle, Download, RefreshCw } from 'lucide-react';

const AiImageEditorPage = () => {
    const { userId, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [format, setFormat] = useState('jpeg');
    const [quality, setQuality] = useState([85]);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [credits, setCredits] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const presetPrompts = ['Enhance', 'Background Removal', 'Retouch', 'Color & Exposure Fix', 'Crop & Resize', 'Filters', 'Face Blur', 'Plate Blur', 'Watermark & Logo'];
    const SHOW_ADVANCED = false;  // 预留，Advanced Options 取消掉

    const API = import.meta.env.VITE_API_SERVER || 'http://127.0.0.1:9292';

    const getUserId = useCallback(() => userId, [userId]);

    const fetchCredits = useCallback(async () => {
        const uid = getUserId();
        if (!uid) return;

        try {
            const res = await fetch(`${API}/api/user/me/credits`, {
                headers: { 'X-User-Id': uid }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'failed');
            setCredits(data.remaining);
        } catch {
            setCredits('—');
            toast({ title: "Could not fetch credits", variant: "destructive" });
        }
    }, [getUserId, toast, API]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    // 清理预览 URL 防止内存泄漏
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const onDrop = useCallback((acceptedFiles, fileRejections) => {
        if (fileRejections.length > 0) {
            fileRejections.forEach(({ errors }) => {
                errors.forEach(err => {
                    toast({ title: "Upload Error", description: err.message, variant: "destructive" });
                });
            });
            return;
        }

        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) return;

        const objectUrl = URL.createObjectURL(uploadedFile);
        const img = new Image();
        img.onload = () => {
            if (img.width < 512 || img.height < 512) {
                toast({ title: "Upload Error", description: "Image resolution must be at least 512x512.", variant: "destructive" });
                URL.revokeObjectURL(objectUrl);
            } else {
                // 如果之前有 blob url，撤销
                if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
                setFile(uploadedFile);
                setPreview(objectUrl);
                setResult(null);
                setError('');
            }
        };
        img.onerror = () => {
            toast({ title: "Upload Error", description: "Invalid image file.", variant: "destructive" });
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    }, [toast, preview]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
        maxSize: 15 * 1024 * 1024, // 15MB
        multiple: false,
    });

    const handleGenerate = async () => {
        const uid = getUserId();
        if (!uid) {
            navigate('/auth', { state: { from: location } });
            return;
        }
        if (!file || !prompt) {
            toast({ title: "Missing Information", description: "Please upload an image and provide edit instructions.", variant: "destructive" });
            return;
        }
        if (typeof credits === 'number' && credits < 10) {
            toast({ title: "Insufficient credits", description: "You need at least 10 credits to generate.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        setError('');
        setResult(null);

        try {
            const fd = new FormData();
            fd.append('prompt', prompt);
            fd.append('image', file, file.name);
            const s = (width && height && width === height) ? `${width}x${height}` : '1024x1024';
            fd.append('size', s);

            const res = await fetch(`${API}/api/ai/image-edit`, {
                method: 'POST',
                body: fd,
                headers: { 'X-User-Id': uid },   // 传递用户ID
                // credentials: 'include'
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Image edit failed');
            }

            const data = await res.json();
            if (data.imageBase64) {
                setResult(`data:${data.mime || 'image/png'};base64,${data.imageBase64}`);
            } else if (data.imageUrl) {
                setResult(data.imageUrl);
            } else {
                throw new Error('No image returned');
            }

            // 后端已扣分；刷新显示
            await fetchCredits();
        } catch (err) {
            setError(err.message || String(err));
        } finally {
            setProcessing(false);
        }
    };


    const handleReset = () => {
        // 撤销 blob url
        if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
        setPrompt('');
        setResult(null);
        setError('');
    };

    return (
        <>
            <Helmet>
                <title>AI Image Editor - CLARK ONLINE, LLC</title>
                <meta name="description" content="Use our powerful AI to edit your images with simple text prompts. Enhance, retouch, remove backgrounds, and more." />
            </Helmet>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center text-[#020817]">
                        <Sparkles className="w-8 h-8 mr-3 text-primary" />
                        AI Image Editor
                    </h1>
                    {isAuthenticated && (
                        <div className="bg-secondary px-4 py-2 rounded-lg text-sm font-medium text-[#020817]">
                            Remaining Credits: <span className="font-bold text-primary">{credits !== null ? credits : <Loader2 className="w-4 h-4 inline animate-spin" />}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Control Panel */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-secondary p-6 rounded-xl border border-border">
                        {!file ? (
                            <div {...getRootProps()} className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors ${isDragActive ? 'border-primary bg-muted' : 'border-border'}`}>
                                <input {...getInputProps()} />
                                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-semibold">Drag & drop an image here</p>
                                <p className="text-muted-foreground">or</p>
                                <Button variant="default" className="mt-2 bg-[#3C83F6] text-white hover:bg-[#3573dd]">Upload Image</Button>
                                <p className="text-xs text-muted-foreground mt-4">JPG, PNG, WebP up to 15MB. Min 512x512px.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <img src={preview} alt="Upload preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => { handleReset(); }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Edit Instructions</Label>
                                        <Textarea
                                            id="prompt"
                                            className="text-foreground placeholder:text-muted-foreground"
                                            placeholder="e.g., make the background transparent, enhance colors..."
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            rows={3}
                                        />
                                </div>
                                    <div className="flex flex-wrap gap-2">
                                        {presetPrompts.map(p => (
                                            <Button
                                                key={p}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPrompt(current => current ? `${current}, ${p.toLowerCase()}` : p)}
                                                className="bg-[#3C83F6] text-white hover:bg-[#3573dd]"
                                            >
                                                {p}
                                            </Button>
                                        ))}
                                    </div>
                                {/* {SHOW_ADVANCED && (  前后注释 Advanced Options开关 */}
                                {SHOW_ADVANCED && (
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="advanced">
                                            <AccordionTrigger>Advanced Options</AccordionTrigger>
                                            <AccordionContent className="space-y-4 pt-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Output Format</Label>
                                                        <Select value={format} onValueChange={setFormat}>
                                                            <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="jpeg">JPG</SelectItem>
                                                                <SelectItem value="png">PNG</SelectItem>
                                                                <SelectItem value="webp">WebP</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Quality: {quality[0]}</Label>
                                                        <Slider defaultValue={[85]} min={60} max={95} step={1} value={quality} onValueChange={setQuality} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="width">Width (px)</Label>
                                                        <Input id="width" type="number" placeholder="e.g., 1024" value={width} onChange={(e) => setWidth(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="height">Height (px)</Label>
                                                        <Input id="height" type="number" placeholder="e.g., 1024" value={height} onChange={(e) => setHeight(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 rounded-md bg-muted p-3">
                                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                    <p className="text-sm text-muted-foreground">Safety filter is always on.</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>)}

                                <div className="flex items-center gap-4 pt-4">
                                    <Button onClick={handleGenerate} disabled={processing} className="w-full">
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        Generate Preview
                                    </Button>
                                    <Button variant="secondary" onClick={handleReset} disabled={processing}>Reset</Button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Result Panel */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-secondary p-6 rounded-xl border border-border flex flex-col items-center justify-center min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {processing ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
                                    <p className="font-semibold text-lg">Processing...</p>
                                    <p className="text-muted-foreground">The AI is working its magic. Please wait.</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-destructive-foreground bg-destructive/80 p-6 rounded-lg">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                                    <p className="font-semibold text-lg">Generation Failed</p>
                                    <p className="text-sm">{error}</p>
                                    <Button variant="secondary" className="mt-4" onClick={handleGenerate}>Try Again</Button>
                                </motion.div>
                            ) : result ? (
                                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-center block mb-2">Before</Label>
                                            <img src={preview} alt="Original" className="rounded-lg border border-border w-full h-auto" />
                                        </div>
                                        <div>
                                            <Label className="text-center block mb-2">After</Label>
                                            <img src={result} alt="Edited Result" className="rounded-lg border border-primary w-full h-auto" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button><Download className="w-4 h-4 mr-2" />Download</Button>
                                                <Button variant="outline" className="bg-[#4E8EF5] hover:bg-[#3f7ae0] text-white border-transparent">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download All Sizes
                                                </Button>

                                                <Button variant="outline" className="bg-[#4E8EF5] hover:bg-[#3f7ae0] text-white border-transparent">
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Regenerate
                                                </Button>
                                        <Button variant="secondary">Continue Editing</Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                                    <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-muted-foreground">Your edited image will appear here</p>
                                    <p className="text-sm text-muted-foreground mt-4 max-w-sm mx-auto">
                                        AI results may vary. Uploaded and generated files will be automatically deleted after 72 hours.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default AiImageEditorPage;