import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowRight, Zap, Star, CheckCircle, UploadCloud, Wand2, Download, Clock, GitBranch, Scaling } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';
const HomePage = () => {
    const featuredProducts = products.filter(product => product.popular).slice(0, 3);
    return <div className="min-h-screen bg-background text-foreground">
        <Helmet>
            <title>CLARK ONLINE, LLC - AI Image Processing Made Simple</title>
            <meta name="description" content="CLARK ONLINE, LLC offers cutting-edge AI solutions for image processing and video generation. Transform your ideas into stunning visuals effortlessly." />
        </Helmet>

        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="absolute inset-0 tech-pattern opacity-70"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div initial={{
                        opacity: 0,
                        x: -50
                    }} animate={{
                        opacity: 1,
                        x: 0
                    }} transition={{
                        duration: 0.8,
                        delay: 0.3
                    }}>
                        <img alt="AI processing an image of a futuristic city" className="rounded-xl shadow-2xl border-4 border-border" src="https://horizons-cdn.hostinger.com/f2fcac03-46c3-44be-8f01-e8b846a720ae/aitup-IyGjR.png" />
                    </motion.div>
                    <motion.div initial={{
                        opacity: 0,
                        y: 30
                    }} animate={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.8
                    }} className="space-y-8 text-center lg:text-left">
                        <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                            AI Image Processing{' '}
                            <span className="gradient-text">Made Simple</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                            Welcome to the future of visual content creation. Our AI-powered tools allow you to enhance, transform, and generate stunning images and videos with unparalleled speed and simplicity.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                            <Link to="/auth">
                                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg pulse-glow">
                                    Get Started
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/ai-image-editor">
                                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                                    Try AI Image Editing
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Value Proposition Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Why CLARK ONLINE</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
                    Instantly enhance, transform, and generate visuals with our state-of-the-art AI technology.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-secondary p-6 rounded-lg border border-border">
                        <Clock className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">Fast</h3>
                        <p className="text-muted-foreground">Results in seconds.</p>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg border border-border">
                        <GitBranch className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">Flexible</h3>
                        <p className="text-muted-foreground">Modify, enhance, and generate to your needs.</p>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg border border-border">
                        <Scaling className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">Scalable</h3>
                        <p className="text-muted-foreground">From trials to enterprise volumes.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{
                    opacity: 0,
                    y: 20
                }} whileInView={{
                    opacity: 1,
                    y: 0
                }} transition={{
                    duration: 0.8
                }} viewport={{
                    once: true
                }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        How It Works
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Transform your images in three simple steps.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.1
                    }} viewport={{
                        once: true
                    }} className="space-y-4">
                        <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mx-auto">
                            <UploadCloud className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">1. Upload Image</h3>
                        <p className="text-muted-foreground">
                            Start by uploading your image or providing a text prompt.
                        </p>
                    </motion.div>

                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.2
                    }} viewport={{
                        once: true
                    }} className="space-y-4">
                        <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mx-auto">
                            <Wand2 className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">2. AI Processing</h3>
                        <p className="text-muted-foreground">
                            Our AI analyzes and transforms your input based on your chosen service.
                        </p>
                    </motion.div>

                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.3
                    }} viewport={{
                        once: true
                    }} className="space-y-4">
                        <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mx-auto">
                            <Download className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">3. Download Result</h3>
                        <p className="text-muted-foreground">
                            Download your high-quality, AI-enhanced image or video.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{
                    opacity: 0,
                    y: 20
                }} whileInView={{
                    opacity: 1,
                    y: 0
                }} transition={{
                    duration: 0.8
                }} viewport={{
                    once: true
                }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        Our Products
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Choose from our AI service packages designed to meet your creative and professional needs.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
                </div>

                <div className="text-center mt-12">
                    <Link to="/products">
                        <Button size="lg" variant="outline" className="px-8 py-4">
                            View All Packages
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{
                    opacity: 0,
                    y: 20
                }} whileInView={{
                    opacity: 1,
                    y: 0
                }} transition={{
                    duration: 0.8
                }} viewport={{
                    once: true
                }} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        What Our Customers Say
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.1
                    }} viewport={{
                        once: true
                    }} className="bg-background p-6 rounded-xl border border-border">
                        <div className="flex items-center mb-4">
                            <img alt="Customer avatar" className="w-12 h-12 rounded-full mr-4" src="https://images.unsplash.com/photo-1653923212805-2982a6a051dc" />
                            <div>
                                <p className="font-bold text-foreground">Sarah L.</p>
                                <p className="text-sm text-muted-foreground">Digital Artist</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground">"CLARK has revolutionized my workflow. The image-to-video feature is a game-changer for my social media content!"</p>
                    </motion.div>
                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.2
                    }} viewport={{
                        once: true
                    }} className="bg-background p-6 rounded-xl border border-border">
                        <div className="flex items-center mb-4">
                            <img alt="Customer avatar" className="w-12 h-12 rounded-full mr-4" src="https://images.unsplash.com/photo-1653756223371-7dd0687680c6" />
                            <div>
                                <p className="font-bold text-foreground">Mark C.</p>
                                <p className="text-sm text-muted-foreground">Marketing Manager</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground">"The AI conversation packages are incredibly powerful for our customer support bots. Highly recommended for any business."</p>
                    </motion.div>
                    <motion.div initial={{
                        opacity: 0,
                        y: 20
                    }} whileInView={{
                        opacity: 1,
                        y: 0
                    }} transition={{
                        duration: 0.6,
                        delay: 0.3
                    }} viewport={{
                        once: true
                    }} className="bg-background p-6 rounded-xl border border-border">
                        <div className="flex items-center mb-4">
                            <img alt="Customer avatar" className="w-12 h-12 rounded-full mr-4" src="https://images.unsplash.com/photo-1519755898819-cef8c3021d6f" />
                            <div>
                                <p className="font-bold text-foreground">Alex D.</p>
                                <p className="text-sm text-muted-foreground">Indie Developer</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground">"Simple, powerful, and affordable. I was able to integrate their AI into my app in just a few hours. Fantastic service!"</p>
                    </motion.div>
                </div>
            </div>
        </section>
    </div>;
};
export default HomePage;