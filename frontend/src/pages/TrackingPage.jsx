import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PageHeader, StatusBadge, ServiceIcon, LoadingSpinner } from '../components/UI';
import { requestApi, paymentApi } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { MapPin, Phone, CreditCard, CheckCircle2 } from 'lucide-react';

export default function TrackingPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [volunteerLoc, setVolunteerLoc] = useState(null);

  const loadRequest = useCallback(async () => {
    try {
      const res = await requestApi.get(id);
      setData(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  const onTrackingUpdate = useCallback(
    (update) => {
      if (String(update.requestId) === id) loadRequest();
    },
    [id, loadRequest]
  );

  const onLocationUpdate = useCallback(
    (loc) => {
      if (String(loc.requestId) === id) {
        setVolunteerLoc({ lat: loc.latitude, lng: loc.longitude });
      }
    },
    [id]
  );

  const { joinRequest, leaveRequest } = useSocket(onTrackingUpdate, onLocationUpdate);

  useEffect(() => {
    loadRequest();
    joinRequest(id);
    const interval = setInterval(loadRequest, 15000);
    return () => {
      leaveRequest(id);
      clearInterval(interval);
    };
  }, [id, loadRequest, joinRequest, leaveRequest]);

  const handlePayment = async () => {
    if (!data?.request) return;
    setPaying(true);
    try {
      const { payment } = await paymentApi.create({ request_id: data.request.id, payment_method: 'upi' });
      await paymentApi.confirm({ payment_id: payment.id, request_id: data.request.id });
      await loadRequest();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh">
        <Navbar />
        <div className="text-center py-20 text-slate-500">Request not found</div>
      </div>
    );
  }

  const { request, tracking } = data;
  const isActive = !['completed', 'cancelled'].includes(request.status);

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <PageHeader title="Track Request" subtitle={request.request_code} />

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <ServiceIcon icon={request.service_icon} className="text-3xl" />
            <div className="flex-1">
              <h2 className="font-bold text-lg text-kalon-900">{request.service_name}</h2>
              <StatusBadge status={request.status} />
            </div>
          </div>

          {request.volunteer_name && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Volunteer</p>
                <p className="font-semibold">{request.volunteer_name}</p>
              </div>
              {request.volunteer_phone && (
                <a href={`tel:${request.volunteer_phone}`} className="btn-secondary py-2 px-3 text-sm flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
            </div>
          )}
        </div>

        {/* Map placeholder */}
        <div className="rounded-2xl overflow-hidden mb-6 h-48 bg-gradient-to-br from-kalon-100 to-kalon-200 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-kalon-600 mx-auto status-pulse" />
              <p className="text-sm text-kalon-800 mt-2 font-medium">
                {volunteerLoc ? 'Volunteer location updating...' : 'Your location pinned'}
              </p>
              <p className="text-xs text-kalon-600 mt-1">
                {request.latitude}, {request.longitude}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-kalon-900 mb-4">Live Timeline</h3>
          <div className="space-y-4">
            {tracking.map((t, i) => (
              <div key={t.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === tracking.length - 1 ? 'bg-kalon-600 status-pulse' : 'bg-kalon-300'}`} />
                  {i < tracking.length - 1 && <div className="w-0.5 flex-1 bg-kalon-200 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-sm capitalize text-kalon-900">{t.status.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-500">{t.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {request.status === 'completed' && request.payment_status !== 'paid' && (
          <button onClick={handlePayment} className="btn-primary w-full flex items-center justify-center gap-2" disabled={paying}>
            {paying ? <LoadingSpinner size="sm" /> : <><CreditCard className="w-5 h-5" /> Pay ₹{request.final_price || request.estimated_price}</>}
          </button>
        )}

        {request.payment_status === 'paid' && (
          <div className="flex items-center gap-2 justify-center text-emerald-600 font-medium">
            <CheckCircle2 className="w-5 h-5" /> Payment completed
          </div>
        )}

        {!isActive && (
          <Link to="/dashboard" className="block text-center mt-4 text-kalon-600 font-medium">
            Back to Home
          </Link>
        )}
      </main>
    </div>
  );
}
