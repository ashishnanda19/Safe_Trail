import { Link } from 'react-router-dom';
import { Shield, Radio, Users, MapPin, AudioLines, HeartPulse, ChevronRight, Activity, Globe } from 'lucide-react';
import { Button } from '@/components/ui';

const LandingPage = () => {
  return (
    <div className="w-full bg-white min-h-screen text-slate-900 font-sans cursor-default scroll-smooth">
      {/* Dynamic Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-shrink-0 items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#E53E6D] flex items-center justify-center shadow-lg shadow-[#E53E6D]/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SafeTraiL</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-[#E53E6D] transition-colors">
              Log in
            </Link>
            <Link to="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Asymmetric Hero Section */}
        <section className="relative overflow-hidden px-6 lg:px-8 max-w-7xl mx-auto pt-16 pb-24 sm:pt-24 sm:pb-32">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#FCE4ED] rounded-full blur-[120px] opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center relative z-10">
            {/* Hero Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FCE4ED] text-[#E53E6D] text-xs font-semibold tracking-wide uppercase mb-6 slide-in-top">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E53E6D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E53E6D]"></span>
                </span>
                Live Emergency Protocols
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.05]">
                Don't face emergencies <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E53E6D] to-rose-400">alone.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                SafeTraiL is a premium, real-time emergency response platform designed to bridge the gap between victims, their personal guardians, and professional emergency services. With high-fidelity maps, real-time location tracking, and automated alerting, SafeTraiL ensures that help is never more than a heartbeat away.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-[#E53E6D] hover:bg-[#d43863] text-white px-8 rounded-full shadow-lg shadow-[#E53E6D]/30 hover:shadow-xl hover:-translate-y-1 transition-all h-14 text-base font-semibold">
                    Deploy Protection
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 rounded-full h-14 border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all text-base font-medium">
                    Access Dashboard
                  </Button>
                </Link>
              </div>

            </div>

            {/* Hero Mockup Graphic */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-[2.5rem] bg-slate-900/5 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-slate-900/10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700 overflow-hidden group">
                <img 
                  src="/hero_map.png" 
                  alt="SafeTraiL Live Map Tracking" 
                  className="rounded-[2rem] border border-white/20 shadow-inner w-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature 1: Left Text, Right Graphic */}
        <section className="py-24 bg-slate-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative">
                <div className="aspect-[4/3] rounded-[2.5rem] bg-white border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E53E6D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* CSS-based Mockup of Voice UI */}
                  <div className="relative w-64 h-64 rounded-full border border-slate-100 flex items-center justify-center p-8 bg-slate-50/50 shadow-inner">
                    <div className="absolute inset-0 rounded-full border border-rose-200 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#E53E6D] to-rose-400 shadow-lg shadow-rose-500/30 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                      <AudioLines className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                  <Radio className="w-6 h-6 text-[#E53E6D]" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Voice Evidence & Stealth Protocols</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Trigger an SOS silently using hidden voice keywords. The system immediately locks your screen, fetches high-precision GPS coordinates, and begins streaming encrypted background audio to your Guardian Circle.
                </p>
                <ul className="space-y-4">
                  {['Customizable activation phrases', 'Encrypted cloud audio buffers', 'Works with screen locked'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <span className="w-6 h-6 rounded-full bg-[#E53E6D]/10 text-[#E53E6D] flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Left Graphic, Right Text */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Smart Mapping & Live Routing</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Our dynamic OpenStreetMap integration tracks emergency incidents and immediately identifies crucial nearby infrastructure. When time is critical, the map automatically routes you to the nearest safe-haven.
                </p>
                <ul className="space-y-4">
                  {['Sub-second location telemetry', 'Nearby Hospitals & Police Stations', 'Real-time incident heatmaps'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nearest Help</h3>
                    <button className="text-[#E53E6D] text-sm font-semibold hover:text-rose-600 transition-colors flex items-center">
                      More on map <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hospital Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors cursor-pointer group/card shadow-sm hover:shadow-md">
                      <div className="text-3xl mb-4">🏥</div>
                      <h4 className="font-bold text-slate-900 mb-1 leading-tight line-clamp-1">Bharadwaj Hospital</h4>
                      <p className="text-[#E53E6D] font-bold mb-4">2.6 km</p>
                      <p className="text-slate-400 text-sm font-medium flex items-center group-hover/card:text-slate-500 transition-colors">
                        Tap for route <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </p>
                    </div>

                    {/* Police Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors cursor-pointer group/card shadow-sm hover:shadow-md">
                      <div className="text-3xl mb-4">🚓</div>
                      <h4 className="font-bold text-slate-900 mb-1 leading-tight line-clamp-1">Karni Vihar Police Station Jaipur</h4>
                      <p className="text-blue-500 font-bold mb-4">18.0 km</p>
                      <p className="text-slate-400 text-sm font-medium flex items-center group-hover/card:text-slate-500 transition-colors">
                        Tap for route <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global CTA Section (Dark Mode Anchor) */}
        <section className="px-6 lg:px-8 py-24 mb-10">
          <div className="max-w-7xl mx-auto rounded-[3rem] bg-slate-950 p-12 md:p-20 relative overflow-hidden text-center shadow-2xl">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Ready for a safer tomorrow?</h2>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed font-light">
                Join SafeTraiL for daily peace of mind. Build your Guardian Circle today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-14 rounded-full border-slate-700 hover:border-slate-600 text-white bg-white/5 backdrop-blur hover:bg-white/10 transition-colors font-medium text-lg">
                    Start Your Free Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 h-14 rounded-full border-slate-700 hover:border-slate-600 text-white bg-white/5 backdrop-blur hover:bg-white/10 transition-colors font-medium text-lg">
                    Sign in to Network
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">SafeTraiL</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Platform</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Protocol</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Emergency Terms</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors">Status</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200/60 text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} SafeTraiL Safety Ecosystem. Precision engineered.</p>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
