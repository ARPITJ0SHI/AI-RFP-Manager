import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import VendorList from './components/VendorList';
import RFPList from './components/RFPList';
import ComparisonView from './components/ComparisonView';
import LandingPage from './components/LandingPage';
import { Sparkles, TrendingUp, FileText, Users } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Dashboard Component with real data
const Dashboard = () => {
  const [stats, setStats] = useState({ rfps: 0, vendors: 0, proposals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [rfpsRes, vendorsRes] = await Promise.all([
          axios.get(`${API_URL}/rfps`),
          axios.get(`${API_URL}/vendors`)
        ]);
        const rfps = rfpsRes.data;
        const vendors = vendorsRes.data;

        // Count proposals from all RFPs
        let proposalCount = 0;
        for (const rfp of rfps) {
          try {
            const propRes = await axios.get(`${API_URL}/rfps/${rfp._id}/proposals`);
            proposalCount += propRes.data.length;
          } catch (e) {
            // Skip if error
          }
        }
        setStats({ rfps: rfps.length, vendors: vendors.length, proposals: proposalCount });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage RFPs and vendor relationships</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Active RFPs', value: loading ? '...' : stats.rfps.toString(), icon: FileText, color: 'bg-blue-600' },
            { label: 'Vendors', value: loading ? '...' : stats.vendors.toString(), icon: Users, color: 'bg-indigo-600' },
            { label: 'Proposals', value: loading ? '...' : stats.proposals.toString(), icon: TrendingUp, color: 'bg-emerald-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Create New RFP</h2>
              <p className="text-sm text-slate-500">Describe your needs in natural language</p>
            </div>
            <ChatInterface />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insight Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI Insight</span>
                </div>
                <p className="text-white/90 leading-relaxed">
                  Consider consolidating your laptop orders. Bulk pricing could save up to 15%.
                </p>
              </div>
            </div>

            {/* Quick Vendors */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Vendors</h2>
              <VendorList compact />
            </div>
          </div>
        </div>

        {/* Recent RFPs */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent RFPs</h2>
          <RFPList />
        </div>
      </div>
    </Layout>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll
    window.scrollTo(0, 0);
    // document.documentElement.scrollTop = 0; // Fallback

    // Ensure scroll happens after layout paint/animations
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<Layout><VendorList /></Layout>} />
        <Route path="/rfps/:id" element={<Layout><ComparisonView /></Layout>} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
