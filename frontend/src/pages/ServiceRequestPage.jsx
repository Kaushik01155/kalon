import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PageHeader, LoadingSpinner } from '../components/UI';
import { serviceApi, vehicleApi, requestApi } from '../lib/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Navigation } from 'lucide-react';

export default function ServiceRequestPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { location, refresh } = useGeolocation();

  useEffect(() => {
    Promise.all([serviceApi.list(), vehicleApi.list()])
      .then(([s, v]) => {
        const found = s.services.find((x) => x.slug === slug);
        setService(found);
        setVehicles(v.vehicles);
        const defaultV = v.vehicles.find((x) => x.is_default);
        if (defaultV) setVehicleId(String(defaultV.id));
      })
      .finally(() => setLoading(false));
    refresh();
  }, [slug, refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return setError('Location required');
    setSubmitting(true);
    setError('');
    try {
      const { request } = await requestApi.create({
        service_type_id: service.id,
        vehicle_id: vehicleId ? parseInt(vehicleId, 10) : null,
        latitude: location.lat,
        longitude: location.lng,
        address,
        notes,
      });
      navigate(`/track/${request.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-dvh">
        <Navbar />
        <div className="text-center py-20 text-slate-500">Service not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <PageHeader title={service.name} subtitle={service.description} />

        <div className="glass-card rounded-2xl p-5 mb-6">
          <p className="text-3xl font-bold text-kalon-700">₹{service.base_price}</p>
          <p className="text-sm text-slate-500">Estimated base price</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {vehicles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Vehicle</label>
              <select className="input-field" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">No vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} — {v.license_plate}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-kalon-50 text-sm text-kalon-800">
              <MapPin className="w-4 h-4 shrink-0" />
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting...'}
            </div>
            <button
              type="button"
              className="mt-2 text-sm text-kalon-600 flex items-center gap-1"
              onClick={refresh}
            >
              <Navigation className="w-4 h-4" /> Refresh location
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address / Landmark</label>
            <input
              className="input-field"
              placeholder="e.g. NH-48 near toll plaza"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Describe your situation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting || !location}>
            {submitting ? <LoadingSpinner size="sm" /> : 'Request Assistance'}
          </button>
        </form>
      </main>
    </div>
  );
}
