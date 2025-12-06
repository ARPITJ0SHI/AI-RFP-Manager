import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

const LandingPage = () => {
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    const testimonials = [
        { quote: "Cut procurement time by 60%", company: "TechCorp", role: "Procurement Lead", bg: "bg-white" },
        { quote: "Saved $50K on vendor selection", company: "Global Dynamics", role: "VP Operations", bg: "bg-blue-50" },
        { quote: "Natural language is a game changer", company: "StartupHub", role: "CEO", bg: "bg-white" },
        { quote: "Seamless vendor management", company: "Enterprise Co", role: "Supply Chain", bg: "bg-amber-50" },
        { quote: "Best tool we've adopted this year", company: "Acme Inc", role: "Director", bg: "bg-rose-50" }
    ];

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 overflow-x-hidden">
            <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
                <nav className="bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-slate-900/5 px-3 py-2.5 flex items-center gap-10 border border-slate-200/50 max-w-3xl w-full justify-between">
                    <div className="flex items-center gap-2.5 pl-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">RFP Manager</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard" className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all flex items-center gap-2">
                            Log in <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </nav>
            </div>

            <section ref={heroRef} className="min-h-screen relative flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-b from-blue-100/50 via-white to-[#fafafa]"
                    style={{ transform: `translateY(${scrollY * 0.5}px)` }}
                />
                <div
                    className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
                    style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.2}px)` }}
                />
                <div
                    className="absolute top-40 right-1/4 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl"
                    style={{ transform: `translate(${-scrollY * 0.15}px, ${scrollY * 0.1}px)` }}
                />

                <div className="relative z-10 text-center px-6 pt-20">
                    <h1
                        className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-8"
                        style={{ transform: `translateY(${scrollY * 0.3}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}
                    >
                        The fastest way<br />
                        to manage <span className="text-blue-600">RFPs</span>
                    </h1>

                    <p
                        className="text-xl text-slate-500 max-w-lg mx-auto mb-16"
                        style={{ transform: `translateY(${scrollY * 0.2}px)`, opacity: Math.max(0, 1 - scrollY / 500) }}
                    >
                        Create RFPs with natural language. Compare vendors with AI. Save weeks of work.
                    </p>

                    <div
                        className="flex gap-4 justify-center"
                        style={{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 400) }}
                    >
                        <Link to="/dashboard" className="px-8 py-4 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fafafa] to-transparent"
                    style={{ transform: `translateY(${-scrollY * 0.1}px)` }}
                />
            </section>

            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center min-h-[80vh]">
                        <div
                            className="sticky top-32"
                            style={{ transform: `translateY(${Math.max(0, (scrollY - 600) * 0.05)}px)` }}
                        >
                            <h2 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight text-slate-900">
                                The<br />
                                RFP Manager<br />
                                difference
                            </h2>
                        </div>

                        <div className="relative py-20">
                            {testimonials.map((t, idx) => (
                                <div
                                    key={idx}
                                    className={`${t.bg} rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/50 p-8 mb-6 transition-all duration-500`}
                                    style={{
                                        transform: `translateX(${Math.sin((scrollY + idx * 200) * 0.003) * 20}px) rotate(${Math.sin((scrollY + idx * 150) * 0.002) * 2}deg)`,
                                    }}
                                >
                                    <p className="text-2xl font-bold text-slate-900 leading-snug mb-6">
                                        "{t.quote}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {t.company[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{t.company}</p>
                                            <p className="text-slate-400 text-sm">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-32 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-slate-900"
                    style={{ transform: `translateY(${Math.max(0, (scrollY - 1500) * -0.1)}px)` }}
                />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fafafa] to-transparent z-10" />

                <div className="max-w-5xl mx-auto px-6 relative z-20">
                    <div
                        className="text-center mb-20"
                        style={{ transform: `translateY(${Math.max(0, (scrollY - 1600) * 0.1)}px)` }}
                    >
                        <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
                            Just describe what you need
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            No forms. No templates. Just tell us what you're looking for.
                        </p>
                    </div>

                    <div
                        className="bg-slate-800 rounded-3xl p-8 md:p-12 border border-slate-700"
                        style={{ transform: `translateY(${Math.max(0, (scrollY - 1800) * 0.05)}px)` }}
                    >
                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white/60 text-sm mb-2">You type:</p>
                                <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">
                                    "I need 20 laptops with 16GB RAM and 512GB SSD for our engineering team. Budget around $30k, delivery within 3 weeks. Need minimum 2 year warranty."
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-8">
                            <p className="text-blue-400 text-sm font-semibold mb-4">AI extracts:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Items", value: "20 Laptops" },
                                    { label: "Specs", value: "16GB, 512GB" },
                                    { label: "Budget", value: "$30,000" },
                                    { label: "Timeline", value: "3 weeks" }
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-700/50 rounded-xl p-4">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                                        <p className="text-white font-bold">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-32 bg-white relative overflow-hidden">
                <div
                    className="absolute -top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50"
                    style={{ transform: `translate(${(scrollY - 2400) * 0.1}px, ${(scrollY - 2400) * -0.05}px)` }}
                />

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div
                            className="md:col-span-7 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-10 text-white relative overflow-hidden"
                            style={{ transform: `translateY(${Math.max(0, (scrollY - 2500) * 0.03)}px)` }}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
                                Send to vendors with one click
                            </h3>
                            <p className="text-slate-400 text-lg relative z-10 mb-8">
                                AI writes professional emails. You just pick the vendors.
                            </p>
                            <div className="flex gap-2">
                                {["TechSupply", "Acme Corp", "Global IT"].map((v, i) => (
                                    <span key={i} className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div
                            className="md:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] p-10 text-white"
                            style={{ transform: `translateY(${Math.max(0, (scrollY - 2600) * 0.05)}px)` }}
                        >
                            <h3 className="text-3xl font-bold mb-4">AI compares proposals</h3>
                            <p className="text-blue-100 mb-6">Ranked by price, delivery, compliance</p>
                            <div className="space-y-3">
                                {[
                                    { name: "TechSupply", score: 94 },
                                    { name: "Acme Corp", score: 87 },
                                    { name: "Global IT", score: 82 }
                                ].map((v, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                        <span className="font-medium">{v.name}</span>
                                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{v.score}/100</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className="md:col-span-5 bg-slate-50 rounded-[2rem] p-10 border border-slate-200"
                            style={{ transform: `translateY(${Math.max(0, (scrollY - 2700) * 0.04)}px)` }}
                        >
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">Parse any response</h3>
                            <p className="text-slate-500 mb-6">AI reads messy vendor emails and extracts pricing, terms, and conditions.</p>
                            <div className="flex flex-wrap gap-2">
                                {["$28,500", "2 weeks", "3yr warranty", "Net 30"].map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div
                            className="md:col-span-7 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-10 border border-amber-100"
                            style={{ transform: `translateY(${Math.max(0, (scrollY - 2800) * 0.02)}px)` }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Get the recommendation</h3>
                                    <p className="text-slate-600">AI explains why each vendor ranks where they do.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-bold text-amber-600">60%</p>
                                    <p className="text-slate-500 text-sm">time saved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-40 bg-slate-900 relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                        transform: `translateY(${(scrollY - 3200) * 0.1}px)`
                    }}
                />

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2
                        className="text-5xl md:text-7xl font-bold text-white mb-16 tracking-tight"
                        style={{ transform: `translateY(${Math.max(0, (scrollY - 3300) * 0.05)}px)` }}
                    >
                        Ready to save<br />hours every week?
                    </h2>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all"
                    >
                        Start for Free <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-slate-900">RFP Manager</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            © 2025 RFP Manager.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;