import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/components/ui/use-toast';
const ProductCard = ({
  product,
  index
}) => {
  const {
    addToCart
  } = useCart();
  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`
    });
  };
  const imageMap = {
    'conv-trial': 'AI conversation icon for trial package',
    'conv-starter': 'AI conversation icon for starter package',
    'conv-pro': 'AI conversation icon for pro package',
    'conv-business': 'AI conversation icon for business package',
    'conv-enterprise': 'AI conversation icon for enterprise package',
    'video-basic': 'Image to video icon for basic package',
    'video-standard': 'Image to video icon for standard package',
    'video-premium': 'Image to video icon for premium package'
  };
  const imageDescription = imageMap[product.id] || 'Abstract technology graphic';
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} whileInView={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    delay: index * 0.1
  }} viewport={{
    once: true
  }} className="bg-secondary rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group flex flex-col">
      <div className="relative mb-4">
        {product.image ? <img alt={product.name} className="rounded-lg w-full h-40 object-cover" src={product.image} /> : <img alt={imageDescription} className="rounded-lg w-full h-40 object-cover" src="https://images.unsplash.com/photo-1595872018818-97555653a011" />}
        {product.popular && <div className="absolute top-2 right-2 flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium">Popular</span>
          </div>}
      </div>

      <div className="flex-grow">
        <p className="text-sm font-medium text-primary mb-1">{product.category}</p>
        <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
      </div>

      <div className="mt-auto">
        <div className="space-y-2 mb-6">
          <div className="text-3xl font-bold text-foreground">
            ${product.price}
          </div>
          <div className="text-primary font-medium">
            {product.credits} {product.type === 'conversation' ? 'conversations' : 'minutes of video'}
          </div>
        </div>

        <Button onClick={handleAddToCart} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 px-4 rounded-lg transition-all duration-300 group-hover:scale-105">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy Now
        </Button>
      </div>
    </motion.div>;
};
export default ProductCard;