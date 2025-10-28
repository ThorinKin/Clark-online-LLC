import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Users, Target, Award, Lightbulb } from 'lucide-react';
const AboutPage = () => {
  return <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      <Helmet>
        <title>About Us - CLARK ONLINE, LLC</title>
        <meta name="description" content="Learn about CLARK ONLINE, LLC's mission to revolutionize AI-powered image processing and video generation technology." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">About CLARK ONLINE</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to democratize AI technology and make advanced image processing and video generation accessible to everyone.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.section initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} viewport={{
        once: true
      }} className="mb-20">
          <div className="bg-secondary rounded-2xl p-8 md:p-12 border border-border">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  At CLARK ONLINE, LLC, we believe that artificial intelligence should empower creativity, not replace it. Our cutting-edge AI solutions are designed to enhance human potential and unlock new possibilities in digital content creation.
                </p>
                <p className="text-lg text-muted-foreground">
                  We're committed to providing accessible, reliable, and innovative AI tools that help individuals and businesses transform their ideas into reality through the power of advanced image processing and video generation technology.
                </p>
              </div>
              <div className="flex justify-center">
                <img alt="Team collaboration in modern office" className="rounded-xl shadow-2xl" src="https://images.unsplash.com/photo-1531497258014-b5736f376b1b" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} viewport={{
        once: true
      }} className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
            icon: Lightbulb,
            title: 'Innovation',
            description: 'Constantly pushing the boundaries of what\'s possible with AI technology.'
          }, {
            icon: Users,
            title: 'Accessibility',
            description: 'Making advanced AI tools available to creators of all skill levels.'
          }, {
            icon: Target,
            title: 'Precision',
            description: 'Delivering accurate, high-quality results that exceed expectations.'
          }, {
            icon: Award,
            title: 'Excellence',
            description: 'Maintaining the highest standards in everything we do, from our code to our support.'
          }].map((value, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="text-center space-y-4 p-6 bg-secondary rounded-xl border border-border">
                <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center mx-auto">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>)}
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} viewport={{
        once: true
      }}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">Meet the Innovators</h2>
          <div className="text-center">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Our diverse team of AI researchers, engineers, and creative professionals is united by a shared passion for innovation and a commitment to pushing the boundaries of what's possible with artificial intelligence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <img alt="AI Research Team Lead" className="w-32 h-32 rounded-full mx-auto border-2 border-primary" src="https://images.unsplash.com/photo-1575383596664-30f4489f9786" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Dr. Sarah Chen</h3>
                  <p className="text-primary">Chief AI Officer</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <img alt="Engineering Team Lead" className="w-32 h-32 rounded-full mx-auto border-2 border-primary" src="https://images.unsplash.com/photo-1644965630234-bd96323dde8b" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Michael Rodriguez</h3>
                  <p className="text-primary">Head of Engineering</p>
                </div>
              </div>
              <div className="text-center space-y-4">
                <img alt="Product Strategy Lead" className="w-32 h-32 rounded-full mx-auto border-2 border-primary" src="https://images.unsplash.com/photo-1575383596664-30f4489f9786" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Emily Johnson</h3>
                  <p className="text-primary">VP of Product</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>;
};
export default AboutPage;