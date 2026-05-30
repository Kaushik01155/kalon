import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { PageHeader, LoadingSpinner } from '../components/UI';
import { vehicleApi } from '../lib/api';
import { Car, Plus, Trash2, Star } from 'lucide-react';

const emptyForm = { make: '', model: '', year: '', license_plate: '', color: '', fuel_type: 'petrol', is_default: false };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => vehicleApi.list().then((r) => setVehicles(r.vehicles)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vehicleApi.create({ ...form, year: form.year ? parseInt(form.year, 10) : null });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    await vehicleApi.remove(id);
    setVehicles((v) => v.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-dvh pb-20">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="My Vehicles" subtitle="Manage your registered vehicles" />
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
              <input className="input-field" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            </div>
            <input className="input-field" placeholder="License Plate" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              <input className="input-field" placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <select className="input-field" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Set as default vehicle
            </label>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <LoadingSpinner size="sm" /> : 'Save Vehicle'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl text-slate-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-kalon-300" />
            No vehicles added yet
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-kalon-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-kalon-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-kalon-900">{v.make} {v.model}</p>
                    {v.is_default && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-sm text-slate-500">{v.license_plate} · {v.fuel_type}</p>
                </div>
                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
