import { Link } from 'react-router-dom';
import { Shield, Fuel, CircleDot, Battery, Truck, Clock, MapPin, Star } from 'lucide-react';
import Navbar from '../components/Navbar';

const services = [
  { icon: Fuel, title: 'Fuel Delivery', desc: 'Emergency fuel at your location' },
  { icon: CircleDot, title: 'Tyre Puncture', desc: 'Quick puncture repair on-spot' },
  { icon: Battery, title: 'Battery Jump', desc: 'Dead battery? We jump start' },
  { icon: Truck, title: 'Towing', desc: 'Safe towing to service center' },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <Navbar />

      <section className="gradient-hero text-white px-4 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-6 backdrop-blur">
            <Shield className="w-4 h-4" /> 24/7 Roadside Assistance
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Help is on the way.<br />Always with <span className="text-kalon-200">Kalon</span>.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Premium roadside assistance — fuel, tyres, battery, towing — tracked in real time by verified volunteers near you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="bg-white text-kalon-700 font-bold py-3.5 px-8 rounded-xl hover:bg-kalon-50 transition shadow-xl">
              Get Help Now
            </Link>
            <Link to="/login?role=volunteer" className="border-2 border-white/40 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition">
              Join as Volunteer
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {services.map((s) => (
            <div key={s.title} className="glass-card rounded-2xl p-4 md:p-6 text-center hover:shadow-lg transition">
              <s.icon className="w-8 h-8 md:w-10 md:h-10 text-kalon-600 mx-auto mb-3" />
              <h3 className="font-bold text-kalon-900 text-sm md:text-base">{s.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-kalon-950 mb-10">Why Kalon?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: 'Fast Response', desc: 'Average 15 min arrival with live tracking' },
            { icon: MapPin, title: 'Real-time Tracking', desc: 'Watch your volunteer approach on the map' },
            { icon: Star, title: 'Trusted Volunteers', desc: 'Verified helpers rated by the community' },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <f.icon className="w-10 h-10 text-kalon-600 mb-4" />
              <h3 className="font-bold text-lg text-kalon-900">{f.title}</h3>
              <p className="text-slate-500 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-kalon-100 py-8 text-center text-slate-400 text-sm">
        © 2026 Kalon Roadside Assistance. All rights reserved.
      </footer>
    </div>
  );
}
