import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PageHeader, StatusBadge, ServiceIcon, LoadingSpinner } from '../components/UI';
import { volunteerApi, requestApi } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { ToggleLeft, ToggleRight, MapPin, Phone, ChevronRight } from 'lucide-react';

export default function VolunteerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await volunteerApi.dashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  const onNewRequest = useCallback(() => load(), [load]);

  useSocket(onNewRequest);

  useEffect(() => {
    load();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        volunteerApi.setLocation(pos.coords.latitude, pos.coords.longitude);
      });
    }
  }, [load]);

  const toggleAvailability = async () => {
    const next = !data.profile.is_available;
    await volunteerApi.setAvailability(next);
    setData((d) => ({ ...d, profile: { ...d.profile, is_available: next } }));
  };

  const acceptJob = async (id) => {
    await requestApi.updateStatus(id, { status: 'accepted' });
    await load();
  };

  const updateJobStatus = async (id, status) => {
    await requestApi.updateStatus(id, { status });
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { profile, pendingRequests, activeJobs, stats } = data;

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageHeader title="Volunteer Dashboard" subtitle={`Welcome, ${profile?.name || 'Volunteer'}`} />

        <div className="glass-card rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Availability</p>
            <p className="font-bold text-lg text-kalon-900">
              {profile?.is_available ? 'Available for jobs' : 'Unavailable'}
            </p>
          </div>
          <button onClick={toggleAvailability} className="text-kalon-600">
            {profile?.is_available ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12 text-slate-400" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Completed', value: stats.completedJobs },
            { label: 'Active', value: stats.activeJobs },
            { label: 'Pending', value: stats.pendingNearby },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-kalon-700">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {activeJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-kalon-900 mb-4">Active Jobs</h2>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <ServiceIcon icon={job.service_icon} />
                    <div className="flex-1">
                      <p className="font-bold text-kalon-900">{job.service_name}</p>
                      <p className="text-sm text-slate-500">{job.customer_name}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <a href={`tel:${job.customer_phone}`} className="btn-secondary py-2 px-3 text-sm">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <MapPin className="w-4 h-4" /> {job.address || `${job.latitude}, ${job.longitude}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.status === 'accepted' && (
                      <button onClick={() => updateJobStatus(job.id, 'en_route')} className="btn-primary text-sm py-2 px-4">
                        Start En Route
                      </button>
                    )}
                    {job.status === 'en_route' && (
                      <button onClick={() => updateJobStatus(job.id, 'in_progress')} className="btn-primary text-sm py-2 px-4">
                        Start Service
                      </button>
                    )}
                    {job.status === 'in_progress' && (
                      <button onClick={() => updateJobStatus(job.id, 'completed')} className="btn-primary text-sm py-2 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25">
                        Complete Job
                      </button>
                    )}
                    <Link to={`/track/${job.id}`} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
                      Track <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-kalon-900 mb-4">Nearby Requests</h2>
          {pendingRequests.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
              No pending requests nearby
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((r) => (
                <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <ServiceIcon icon={r.service_icon} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-kalon-900">{r.service_name}</p>
                    <p className="text-xs text-slate-500">{r.customer_name} · ₹{r.estimated_price}</p>
                  </div>
                  <button
                    onClick={() => acceptJob(r.id)}
                    disabled={!profile?.is_available}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
