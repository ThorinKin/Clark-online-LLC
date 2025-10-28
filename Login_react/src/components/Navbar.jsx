// Login_react/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu, X, Zap, ChevronDown, LogIn, User, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { getTotalItems } = useCart();
    const { user, logout, isAuthenticated } = useAuth();

    // 统一显示名：优先 userName，其次 email，最后Account
    const displayName = user?.userName ?? user?.email ?? 'Account';

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'AI Image Editor', path: '/ai-image-editor', icon: <Sparkles className="w-4 h-4 mr-2" /> },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const legalItems = [
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms of Service', path: '/terms-of-service' },
        { name: 'Refund Policy', path: '/refund-policy' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">CLARK ONLINE, LLC</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors ${location.pathname === item.path ? 'text-primary font-semibold' : ''
                                    } ${item.path === '/ai-image-editor' ? 'text-primary' : ''}`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                                Legal <ChevronDown className="w-4 h-4 ml-1" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {legalItems.map((item) => (
                                    <DropdownMenuItem key={item.name} asChild>
                                        <Link to={item.path}>{item.name}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex items-center space-x-4">
                            <Link to="/cart" className="relative">
                                <Button variant="ghost" size="sm" className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {getTotalItems() > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {getTotalItems()}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        {/* 用户名颜色改白色 */}
                                        <Button variant="default" size="sm" className="bg-[#3C83F6] text-white hover:bg-[#3573dd]">
                                            <User className="w-4 h-4 mr-2" />
                                            {displayName}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => alert('🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀')}>
                                            My Account
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link to="/auth">
                                    {/* 按钮背景色改： #3C83F6 */}
                                    <Button variant="default" size="sm" className="bg-[#3C83F6] text-white hover:bg-[#3573dd]">
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Login
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden flex items-center space-x-2">
                        <Link to="/cart" className="relative">
                            <Button variant="ghost" size="sm" className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {getTotalItems() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {getTotalItems()}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        {isAuthenticated ? (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Link to="/auth">
                                {/* 移动端登录使用同色背景 */}
                                <Button variant="default" size="sm" className="bg-[#3C83F6] text-white hover:bg-[#3573dd]">
                                    <LogIn className="w-5 h-5" />
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-foreground"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden py-4 space-y-4"
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="flex items-center text-foreground hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                        <div className="border-t border-border pt-4 mt-4 space-y-2">
                            <p className="text-muted-foreground px-2 text-sm font-semibold">Legal</p>
                            {legalItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="block text-foreground hover:text-primary transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;