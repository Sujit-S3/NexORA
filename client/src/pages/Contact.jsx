import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone, CheckCircle2 } from 'lucide-react';
import { contactService } from '@services/contactService';

const INITIAL_FORM = { name: '', email: '', subject: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('contact-', '');
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await contactService.submit(form);
      setSent(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

          {sent ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium">Message sent — we&apos;ll get back to you soon.</p>
              <button onClick={() => setSent(false)} className="text-[#D4AF37] hover:underline text-sm font-medium">
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div role="alert" className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input id="contact-name" type="text" required minLength={2} value={form.name} onChange={handleChange} className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input id="contact-email" type="email" required value={form.email} onChange={handleChange} className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your email" />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                <input id="contact-subject" type="text" value={form.subject} onChange={handleChange} className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="How can we help?" />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                <textarea id="contact-message" rows="5" required minLength={10} value={form.message} onChange={handleChange} className="w-full bg-[#F8F6F1] dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#D4AF37]" placeholder="Your message..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#D4AF37] hover:bg-[#C9A96E] disabled:opacity-50 text-white font-medium py-4 rounded transition-colors uppercase tracking-wider">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
