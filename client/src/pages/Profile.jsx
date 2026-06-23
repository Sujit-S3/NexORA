// NexORA — Profile Page (stub)
import { useAuth } from '@context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  return (
    <div className="section container-app animate-fade-in">
      <h1 className="section-title mb-8">My Profile</h1>
      <div className="card p-10 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge badge-primary mt-1">{user?.role}</span>
          </div>
        </div>
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span>Profile editing coming in Phase 2.</span>
        </div>
      </div>
    </div>
  );
};
export default Profile;
