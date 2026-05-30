import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Phone, ArrowRight } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/UI';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'customer';
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(phone);
      if (res.otp) setDevOtp(res.otp);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ phone, code: otp, name: name || undefined, role });
      login(res.token, res.user);

      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'volunteer') navigate('/volunteer');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="gradient-hero px-4 pt-10 pb-16 text-white text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <Shield className="w-8 h-8" />
          <span className="text-2xl font-bold">Kalon</span>
        </Link>
        <h1 className="text-2xl font-bold">
          {role === 'volunteer' ? 'Volunteer Login' : 'Customer Login'}
        </h1>
        <p className="text-blue-100 mt-2">Sign in with OTP — no password needed</p>
      </div>

      <div className="flex-1 px-4 -mt-8">
        <div className="max-w-md mx-auto glass-card rounded-2xl p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    className="input-field pl-11"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    pattern="\d{10}"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-slate-400 text-center">
                Demo: 7777777777 (customer), 8888888888 (volunteer), 9999999999 (admin)
              </p>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              {devOtp && (
                <div className="p-3 rounded-xl bg-kalon-50 text-kalon-700 text-sm text-center">
                  Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-kalon-600">
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
