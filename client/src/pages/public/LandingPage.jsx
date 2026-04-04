import { Link } from 'react-router-dom';
import { Shield, Radio, Users, MapPin, AudioLines, HeartPulse, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-[#E53E6D] rounded shadow-sm">
                <Shield className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">SafeTraiL</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Log in
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FCE4ED] via-white to-slate-100 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Your safety, <span className="text-[#E53E6D]">always connected</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
            SafeTraiL is a complete emergency management platform. Request help instantly via physical buttons, voice commands, or on-screen alerts, and stream your status securely to trusted Guardians.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <Button size="lg" className="px-8 flex flex-row items-center gap-2">
                Create Free Account
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="px-8 border-slate-300 bg-white shadow-sm text-slate-700 hover:bg-slate-50">
                Sign in to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Badges / Quick Stats */}
      <div className="border-y border-slate-200 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#FCE4ED] rounded-full flex items-center justify-center text-[#E53E6D] mb-1">
                <Radio className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-900">Real-time Ping</span>
              <span className="text-xs text-slate-500">Live GPS tracking</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#FCE4ED] rounded-full flex items-center justify-center text-[#E53E6D] mb-1">
                <AudioLines className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-900">Voice Evidence</span>
              <span className="text-xs text-slate-500">Secure Audio Streams</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#FCE4ED] rounded-full flex items-center justify-center text-[#E53E6D] mb-1">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-900">Guardian Circles</span>
              <span className="text-xs text-slate-500">Trusted peer network</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#FCE4ED] rounded-full flex items-center justify-center text-[#E53E6D] mb-1">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-900">Smart Mapping</span>
              <span className="text-xs text-slate-500">Nearby Hospitals/Police</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlight Section */}
      <div className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Empowering personal security through technology</h2>
            <p className="text-lg text-slate-600">
              When every second counts, SafeTraiL ensures help is notified instantly with precise location data and critical audio evidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-md transition-shadow">
              <HeartPulse className="w-10 h-10 text-[#E53E6D] mb-5" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Alerts</h3>
              <p className="text-slate-600 leading-relaxed">
                Trigger an SOS alert with a single tap, or use our hidden voice keywords to request help silently. Your phone immediately begins recording background audio and fetching high-precision GPS coordinates.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-md transition-shadow">
              <Users className="w-10 h-10 text-[#E53E6D] mb-5" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Guardian Network</h3>
              <p className="text-slate-600 leading-relaxed">
                Build your own "Guardian Circle" of trusted friends and family. During an emergency, they receive a loud push notification and a live-tracking dashboard to monitor your situation in real-time.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
              <MapPin className="w-10 h-10 text-[#E53E6D] mb-5" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live Map Integration</h3>
              <p className="text-slate-600 leading-relaxed">
                Our dynamic map tracks emergency incidents and immediately identifies nearby crucial infrastructure like Hospitals, Police Stations, and Safe Zones using OpenStreetMap technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-[#E53E6D] rounded shadow-sm">
                <Shield className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SafeTraiL</span>
            </div>
            <div className="flex gap-8 text-sm">
              <div className="hover:text-white cursor-pointer transition-colors">About Us</div>
              <div className="hover:text-white cursor-pointer transition-colors">Privacy Policy</div>
              <div className="hover:text-white cursor-pointer transition-colors">Terms of Service</div>
              <div className="hover:text-white cursor-pointer transition-colors">Contact Support</div>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SafeTraiL / GuardianCircle Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
