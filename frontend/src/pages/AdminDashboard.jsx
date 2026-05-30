import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { PageHeader, StatusBadge, LoadingSpinner } from '../components/UI';
import { adminApi } from '../lib/api';
import { Users, ClipboardList, Activity, IndianRupee, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { stats, recentRequests, serviceBreakdown, volunteers } = data;

  const statCards = [
    { icon: Users, label: 'Customers', value: stats.total_customers, color: 'text-blue-600 bg-blue-50' },
    { icon: Activity, label: 'Volunteers', value: stats.total_volunteers, color: 'text-indigo-600 bg-indigo-50' },
    { icon: ClipboardList, label: 'Total Requests', value: stats.total_requests, color: 'text-purple-600 bg-purple-50' },
    { icon: TrendingUp, label: 'Active', value: stats.active_requests, color: 'text-amber-600 bg-amber-50' },
    { icon: IndianRupee, label: 'Revenue', value: `₹${Number(stats.total_revenue).toLocaleString()}`, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader title="Admin Dashboard" subtitle="Platform overview & analytics" />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-kalon-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-kalon-900 mb-4">Service Breakdown</h3>
            <div className="space-y-3">
              {serviceBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{s.name}</span>
                  <span className="font-bold text-kalon-700">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-kalon-900 mb-4">Top Volunteers</h3>
            <div className="space-y-3">
              {volunteers.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    <p className="text-xs text-slate-400">{v.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-kalon-700">{v.total_jobs} jobs</p>
                    <p className="text-xs text-amber-600">★ {v.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-kalon-900 mb-4">Recent Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Customer</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Volunteer</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-3 font-mono text-xs">{r.request_code}</td>
                    <td className="py-3">{r.service_name}</td>
                    <td className="py-3 hidden sm:table-cell">{r.customer_name}</td>
                    <td className="py-3 hidden md:table-cell">{r.volunteer_name || '—'}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
