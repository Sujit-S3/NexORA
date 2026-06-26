import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone } from 'lucide-react';

const Contact = () => {
  return (
    <div className="pt-28 pb-20 container-app min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-playfair mb-4">Contact NexORA</h1>
          <p className="text-gray-500 dark:text-gray-400">Our concierge team is available to assist you with any inquiries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-[#0A0A0A] p-8 text-center rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
            <Mail className="w-8 h-8 mx-auto mb-4 text-[#D4AF37]" />
            <h3 className="font-playfair text-xl mb-2">Email Support</h3>
            <p className="text-sm text-gray-500 mb-4">For general inquiries and support.</p>
            <a href="mailto:support@nexora.app" className="text-[#D4AF37] hover:underline">support@nexora.app</a>
          </div>

          <div className="bg-white dark:bg-[#0A0A0A] p-8 text-center rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
            <MessageSquare className="w-8 h-8 mx-auto mb-4 text-[#D4AF37]" />
            <h3 className="font-playfair text-xl mb-2">AI Concierge</h3>
            <p className="text-sm text-gray-500 mb-4">Instant assistance for product discovery.</p>
            <a href="/concierge" className="text-[#D4AF37] hover:underline">Start Chat</a>
          </div>

          <div className="bg-white dark:bg-[#0A0A0A] p-8 text-center rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
            <Phone className="w-8 h-8 mx-auto mb-4 text-[#D4AF37]" />
            <h3 className="font-playfair text-xl mb-2">Business Inquiries</h3>
            <p className="text-sm text-gray-500 mb-4">For partnerships and press.</p>
            <a href="mailto:business@nexora.app" className="text-[#D4AF37] hover:underline">business@nexora.app</a>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0A0A] p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-playfair mb-6">Send us a message</h2>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input type="text" className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input type="email" className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
              <input type="text" className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="How can we help?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea rows="5" className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your message..."></textarea>
            </div>
            <button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#C9A96E] text-white font-medium py-4 rounded transition-colors uppercase tracking-wider">
              Send Message
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
