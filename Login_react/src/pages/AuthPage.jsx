// Login_react/src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { color, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { requestWithFetch } from '@/service/fetch' 

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '' });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async(e) => {
    e.preventDefault();
    // In a real app, you'd validate credentials against a backend.
    // Here, we'll just simulate a successful login.
    const userData = {
      //name: loginData.email.split('@')[0], // Using part of email as name for demo
      email: loginData.email,
      password: loginData.password
    };
    try{
      //let res = await requestWithFetch('/api/login', {
      //  method: 'POST',
      //  payload:userData
      //})
        //login({name:res});
      const res = await requestWithFetch('/api/login', { method: 'POST', payload: userData });
      const payload = (res && res.Response) ? res.Response : res;  // 兼容两种返回
      if (!payload?.id) throw new Error('Login response missing id'); // 把 {id, userName, email} 存进 AuthContext
      login({ id: payload.id, userName: payload.userName, email: payload.email });

      toast({
        title: "✅ Login Successful!",
        description: "Welcome back! Redirecting you to the homepage...",
      });
      setTimeout(() => navigate('/'), 1500);
    }
    catch(err){
      toast({
        title: "❌ Login Failed!",
        description: err.message || "An error occurred during login. Please try again.",
      });
    }
    
  };

  const handleRegister =async (e) => {
    e.preventDefault();
    // Simulate registration and login
    const userData = {
      name: registerData.name,
      email: registerData.email,
      phone: registerData.phone,
      password: registerData.password
    };
    //let resData = await requestWithFetch('/api/register', {
    //  method: 'POST',
    //  payload:userData
    //})
      //login({name:resData});

    const res = await requestWithFetch('/api/register', { method: 'POST', payload: userData });
    const payload = (res && res.Response) ? res.Response : res;
    if (!payload?.id) throw new Error('Register response missing id');
    login({ id: payload.id, userName: payload.userName, email: payload.email });

    toast({
      title: "✅ Registration Successful!",
      description: "Welcome aboard! Redirecting you to the homepage...",
    });
    setTimeout(() => navigate('/'), 2000);
  };
  
  const handleForgotPassword = () => {
    navigate('/contact');
  };

  return (
    <>
      <Helmet>
        <title>Login & Register - CLARK ONLINE, LLC</title>
        <meta name="description" content="Access your CLARK ONLINE, LLC account or create a new one to start using our AI services." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="bg-secondary p-8 rounded-b-lg border border-t-0 border-border">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
                  <p className="text-muted-foreground">Sign in to continue to your account.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" name="email" type="email" placeholder="your@email.com" style={{color:"black"}} required className="pl-10" value={loginData.email} onChange={handleLoginChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" name="password" type="password" placeholder="••••••••" style={{color:"black"}} required className="pl-10" value={loginData.password} onChange={handleLoginChange} />
                    </div>
                  </div>
                  <div className="text-right">
                    <Button variant="link" type="button" onClick={handleForgotPassword} className="p-0 h-auto text-sm text-primary">
                      Forgot Password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </div>
            </TabsContent>
            <TabsContent value="register">
              <div className="bg-secondary p-8 rounded-b-lg border border-t-0 border-border">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Create an Account</h2>
                  <p className="text-muted-foreground">Join us and start creating today!</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-name" name="name" type="text" placeholder="John Doe" style={{color:'black'}} required className="pl-10" value={registerData.name} onChange={handleRegisterChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-email" name="email" type="email" placeholder="your@email.com" style={{color:'black'}} required className="pl-10" value={registerData.email} onChange={handleRegisterChange} />
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-phone" name="phone" type="tel" placeholder="(123) 456-7890" style={{color:'black'}} required className="pl-10" value={registerData.phone} onChange={handleRegisterChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="register-password" name="password" type="password" placeholder="••••••••" style={{color:'black'}} required className="pl-10" value={registerData.password} onChange={handleRegisterChange} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;
