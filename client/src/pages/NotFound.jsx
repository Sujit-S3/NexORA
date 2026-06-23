// NexORA — 404 Not Found Page

import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center animate-slide-up">
        <div className="text-[120px] font-display font-black gradient-text leading-none mb-4">404</div>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            ← Go Back
          </button>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
