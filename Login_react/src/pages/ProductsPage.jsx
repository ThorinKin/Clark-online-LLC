//Login_react/src/pages/ProductsPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Filter, MessageSquare, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

const ProductsPage = () => {
  const [filter, setFilter] = useState('all');

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(product => product.type === filter);

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>AI Service Packages - CLARK ONLINE, LLC</title>
        <meta name="description" content="Browse our AI conversation and image-to-video processing packages. Choose the perfect plan for your creative needs." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Our AI Service Packages
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our comprehensive range of AI-powered services designed to transform your creative workflow.
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={`transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            All Packages
          </Button>
          <Button
            onClick={() => setFilter('conversation')}
            variant={filter === 'conversation' ? 'default' : 'outline'}
            className={`transition-all ${filter === 'conversation' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Conversations
          </Button>
          <Button
            onClick={() => setFilter('video')}
            variant={filter === 'video' ? 'default' : 'outline'}
            className={`transition-all ${filter === 'video' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Video className="w-4 h-4 mr-2" />
            Image-to-Video
          </Button>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No products found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;