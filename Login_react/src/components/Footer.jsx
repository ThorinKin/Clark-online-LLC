import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Zap } from 'lucide-react';
const Footer = () => {
  return <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CLARK ONLINE, LLC</span>
            </div>
            <p className="text-muted-foreground">
              AI Image Processing Made Simple.
            </p>
          </div>

          <div className="space-y-4">
            <span className="text-lg font-semibold text-foreground">Quick Links</span>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/products" className="block text-muted-foreground hover:text-primary transition-colors">Products</Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-lg font-semibold text-foreground">Legal</span>
            <div className="space-y-2">
              <Link to="/privacy-policy" className="block text-muted-foreground hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link>
              <Link to="/terms-of-service" className="block text-muted-foreground hover:text-primary transition-colors cursor-pointer">Terms of Service</Link>
              <Link to="/refund-policy" className="block text-muted-foreground hover:text-primary transition-colors cursor-pointer">Refund Policy</Link>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-lg font-semibold text-foreground">Contact Info</span>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">support@clarknets.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">3713 US Highway 259 N, De Kalb, TX 75559, US</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2025 CLARK ONLINE, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;