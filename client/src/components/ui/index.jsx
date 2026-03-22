// Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${sizes[size]} ${className}`} />
  );
};

// Badge
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    primary: 'bg-[#FCE4ED] text-[#E53E6D]',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Card
export const Card = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 ${onClick ? 'cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Button
export const Button = ({
  children, variant = 'primary', size = 'md', isLoading = false,
  disabled = false, className = '', fullWidth = false, icon, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: 'bg-[#E53E6D] text-white hover:bg-[#C0304F] focus:ring-[#E53E6D]/40 shadow-sm',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/40',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500/40',
    outline: 'border border-[#E53E6D] text-[#E53E6D] hover:bg-[#FCE4ED] focus:ring-[#E53E6D]/40',
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
};

// Input
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      className={`border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E53E6D]/20 focus:border-[#E53E6D] placeholder:text-slate-400 disabled:bg-slate-50 transition-colors ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// Textarea
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      className={`border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E53E6D]/20 focus:border-[#E53E6D] placeholder:text-slate-400 resize-none transition-colors ${error ? 'border-red-400' : ''} ${className}`}
      rows={3}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// Modal (bottom-sheet on mobile)
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

// Skeleton loader
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

// Toggle switch
export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer select-none">
    {label && <span className="text-sm text-slate-700">{label}</span>}
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#E53E6D]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </label>
);
