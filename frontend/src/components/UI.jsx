const icons = {
  fuel: '⛽',
  tyre: '🛞',
  battery: '🔋',
  tow: '🚛',
};

export function ServiceIcon({ icon, className = 'text-3xl' }) {
  return <span className={className}>{icons[icon] || '🛠️'}</span>;
}

export function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-blue-100 text-blue-800',
    en_route: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-emerald-100 text-emerald-800',
  };

  const labels = {
    en_route: 'En Route',
    in_progress: 'In Progress',
  };

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {labels[status] || status}
    </span>
  );
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-3 border-kalon-200 border-t-kalon-600 rounded-full animate-spin`} />
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-kalon-950">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
