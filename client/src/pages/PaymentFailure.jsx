import { Link, useSearchParams } from 'react-router-dom';
import { QrCode, Building2, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const reason = searchParams.get('reason');
  
  const [copiedText, setCopiedText] = useState('');

  const isLimitError = reason?.toLowerCase().includes('limit');

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="section container-app flex justify-center items-center min-h-[70vh] py-12 animate-fade-in">
      <div className="card p-8 md:p-12 max-w-3xl w-full border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${isLimitError ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
            {isLimitError ? <Building2 size={40} strokeWidth={1.5} /> : <AlertCircle size={40} strokeWidth={1.5} />}
          </div>
          <h2 className="text-4xl font-display font-bold mb-4 text-gray-900 dark:text-white">
            {isLimitError ? 'VIP Payment Required' : 'Payment Failed'}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {isLimitError 
              ? 'Your order exceeds standard online gateway limits. For your security and convenience, please use our secure VIP direct transfer methods below.' 
              : 'We couldn\'t process your payment. Your order has been placed but is pending payment.'}
          </p>
          {!isLimitError && reason && <p role="alert" className="text-sm text-red-500 mt-4">{reason}</p>}
        </div>

        {/* Order Details */}
        <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-5 mb-10 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p><span className="text-gray-500 mr-2">Order ID:</span> <span className="font-mono text-gray-900 dark:text-white tracking-wider">{orderId}</span></p>
          {paymentId && <p className="mt-2 sm:mt-0"><span className="text-gray-500 mr-2">Attempted TXN ID:</span> <span className="font-mono text-gray-900 dark:text-white tracking-wider">{paymentId}</span></p>}
        </div>

        {/* VIP Payment Methods (Shown for Limit Errors or optionally always) */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Wire Transfer Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-6 group hover:border-accent/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-accent">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-display font-medium dark:text-white">Direct Wire Transfer</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-200">NexORA Luxury Retail Pvt Ltd</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="font-mono font-medium text-lg text-gray-900 dark:text-gray-200">9876 5432 1098 7654</p>
                </div>
                <button onClick={() => copyToClipboard('9876543210987654', 'acc')} className="p-2 text-gray-400 hover:text-accent transition-colors" title="Copy Account Number">
                  {copiedText === 'acc' ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Routing / IFSC</p>
                  <p className="font-mono font-medium text-lg text-gray-900 dark:text-gray-200">NEXO0009876</p>
                </div>
                <button onClick={() => copyToClipboard('NEXO0009876', 'ifsc')} className="p-2 text-gray-400 hover:text-accent transition-colors" title="Copy IFSC">
                  {copiedText === 'ifsc' ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-6 group hover:border-accent/50 transition-colors flex flex-col items-center text-center">
             <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 rounded-br-full -z-10 transition-transform group-hover:scale-110"></div>
             <div className="flex items-center justify-center gap-3 mb-6 w-full">
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-accent">
                <QrCode size={24} />
              </div>
              <h3 className="text-xl font-display font-medium dark:text-white">VIP QR Payment</h3>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block mb-6 shadow-sm">
              <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                 {/* Placeholder for actual QR code image */}
                 <QrCode size={64} className="text-gray-300" strokeWidth={1} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">Scan using any supported VIP payment app.</p>
            <p className="text-xs font-mono text-gray-400">nexora.vip@luxurybank</p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-100 dark:border-gray-800">
          <Link to={`/orders/${orderId}`} className="btn-primary w-full sm:w-auto px-10">
            View Order Status
          </Link>
          <Link to="/products" className="btn w-full sm:w-auto px-10">
            Continue Shopping
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default PaymentFailure;
