import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PageHeader, ServiceIcon, LoadingSpinner } from '../components/UI';
import { serviceApi, requestApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, ChevronRight } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([serviceApi.list(), requestApi.my()])
      .then(([s, r]) => {
        setServices(s.services);
        setRecentRequests(r.requests.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader
          title={`Hello, ${user?.name || 'there'} 👋`}
          subtitle="What assistance do you need today?"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {services.map((s) => (
            <Link
              key={s.id}
              to={`/request/${s.slug}`}
              className="glass-card rounded-2xl p-4 md:p-5 hover:shadow-lg hover:border-kalon-300 transition group"
            >
              <ServiceIcon icon={s.icon} />
              <h3 className="font-bold text-kalon-900 mt-3 text-sm md:text-base">{s.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
              <p className="text-kalon-600 font-bold mt-2 text-sm">₹{s.base_price}</p>
              <ChevronRight className="w-4 h-4 text-kalon-400 mt-2 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>

        {recentRequests.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-kalon-900">Recent Requests</h2>
              <Link to="/requests" className="text-sm text-kalon-600 font-medium">View all</Link>
            </div>
            <div className="space-y-3">
              {recentRequests.map((r) => (
                <Link
                  key={r.id}
                  to={`/track/${r.id}`}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition block"
                >
                  <ServiceIcon icon={r.service_icon} className="text-2xl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-kalon-900">{r.service_name}</p>
                    <p className="text-xs text-slate-500">{r.request_code}</p>
                  </div>
                  <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-kalon-100 text-kalon-700">
                    {r.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          to="/vehicles"
          className="mt-6 glass-card rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition block"
        >
          <MapPin className="w-8 h-8 text-kalon-600" />
          <div>
            <p className="font-semibold text-kalon-900">Manage Vehicles</p>
            <p className="text-sm text-slate-500">Add or update your vehicles</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
      </main>
    </div>
  );
}
