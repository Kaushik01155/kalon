import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PageHeader, StatusBadge, ServiceIcon, LoadingSpinner } from '../components/UI';
import { requestApi } from '../lib/api';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestApi.my().then((r) => setRequests(r.requests)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader title="My Requests" subtitle="All your assistance requests" />

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <p className="text-slate-500 mb-4">No requests yet</p>
            <Link to="/dashboard" className="btn-primary inline-block">Request Help</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Link
                key={r.id}
                to={`/track/${r.id}`}
                className="glass-card rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition block"
              >
                <ServiceIcon icon={r.service_icon} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-kalon-900">{r.service_name}</p>
                  <p className="text-xs text-slate-500">{r.request_code} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
