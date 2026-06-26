import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="pt-28 pb-20 container-app min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white dark:bg-[#0A0A0A] p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <h1 className="text-4xl font-playfair mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Data Storage & Protection</h2>
            <p className="leading-relaxed">
              At NexORA, we prioritize the security of your personal and payment information. We utilize industry-standard encryption for all data storage. Your payment information is tokenized and never stored directly on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. User Accounts</h2>
            <p className="leading-relaxed">
              When you create an account, we store your name, email, and order history to provide a personalized luxury experience. You have the right to request the deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. AI Concierge Usage</h2>
            <p className="leading-relaxed">
              Conversations with the NexORA AI Concierge are stored to improve recommendations and provide continuity across sessions. These interactions are anonymized and processed securely. We do not sell your conversation data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Analytics & Tracking</h2>
            <p className="leading-relaxed">
              We utilize analytics services (such as Google Analytics and Microsoft Clarity) to understand how visitors interact with our platform. This helps us optimize performance and improve user experience. All tracking data is anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Cookies</h2>
            <p className="leading-relaxed">
              NexORA uses essential cookies to maintain your session, secure your account, and remember your cart. We also use functional cookies to remember your preferences (e.g., dark mode) and analytical cookies to improve our services.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
