import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  return (
    <div className="pt-28 pb-20 container-app min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white dark:bg-[#0A0A0A] p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <h1 className="text-4xl font-playfair mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Accounts & Registration</h2>
            <p className="leading-relaxed">
              You must provide accurate and complete information when creating a NexORA account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Purchases & Transactions</h2>
            <p className="leading-relaxed">
              All luxury items listed on NexORA are subject to availability. We reserve the right to limit the quantity of items purchased per person or per order. Prices are subject to change without notice. All transactions are securely processed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Refunds & Returns</h2>
            <p className="leading-relaxed">
              NexORA offers a 14-day return policy for eligible items, provided they are in pristine, unworn condition with all original tags, authenticity cards, and packaging intact. Bespoke or customized items are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Acceptable Use</h2>
            <p className="leading-relaxed">
              You agree not to use the platform for any unlawful purpose, or to solicit others to perform or participate in any unlawful acts. You may not attempt to circumvent the security features of the platform or the AI Concierge system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. AI Features Disclaimer</h2>
            <p className="leading-relaxed">
              The NexORA AI Concierge is an automated system designed to assist with product discovery. While we strive for accuracy, the AI may occasionally provide inaccurate or incomplete information. NexORA is not liable for purchase decisions made solely based on AI recommendations. Always verify product details before checkout.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
