'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateSlotsForDay, getDoctorSchedule, toggleSlotStatus } from '../actions';
import { format } from 'date-fns';
import Link from 'next/link';

// --- COMPONENTS ---

// 1. Admin Login Component
function AdminLogin({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple Admin Check
        if (username === 'admin' && password === 'admin123') {
            onLogin();
        } else {
            setError('Invalid Credentials');
        }
    };

    return (
        <div className="mobile-container flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-sm">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl shadow-slate-900/20 mb-6">
                    🏨
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">Doctor Portal</h2>
                <p className="text-center text-slate-500 mb-8 font-medium">Secure Admin Access</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">ID</label>
                        <input
                            className="input bg-white"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="admin"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <input
                            type="password"
                            className="input bg-white"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl">{error}</div>}

                    <button type="submit" className="btn btn-primary bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 w-full mt-4">
                        Access Dashboard
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

// 2. Dashboard Component
export default function DoctorDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, booked: 0, available: 0 });

    useEffect(() => {
        const auth = sessionStorage.getItem('doctor_auth');
        if (auth === 'true') setIsAuthenticated(true);
    }, []);

    const handleAuthSuccess = () => {
        sessionStorage.setItem('doctor_auth', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('doctor_auth');
        setIsAuthenticated(false);
    };

    const fetchSlots = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDoctorSchedule(date);
            setSlots(data);
            // Calc stats
            setStats({
                total: data.length,
                booked: data.filter((s: any) => s.status === 'BOOKED').length,
                available: data.filter((s: any) => s.status === 'AVAILABLE').length
            });
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        if (isAuthenticated) fetchSlots();
    }, [isAuthenticated, fetchSlots]);

    const handleGenerate = async () => {
        if (!confirm("Generate slots for this day?")) return;
        setLoading(true);
        await generateSlotsForDay(date);
        await fetchSlots();
    };

    const handleToggle = async (id: string, currentStatus: string) => {
        if (currentStatus === 'BOOKED') return;
        await toggleSlotStatus(id);
        await fetchSlots();
    };

    if (!isAuthenticated) return <AdminLogin onLogin={handleAuthSuccess} />;

    return (
        <div className="mobile-container pb-6">
            {/* Header */}
            <header className="px-6 py-6 bg-white sticky top-0 z-40 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h1 className="text-1xl font-bold text-slate-900">Dr. Dashboard</h1>
                    <p className="text-xs font-medium text-slate-400">Manage your day</p>
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">
                    Log Out
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Date & Actions */}
                <div className="bg-white p-4 rounded-[20px] shadow-sm flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-700 font-bold outline-none text-sm"
                    />
                    <button
                        onClick={handleGenerate}
                        className="bg-slate-900 text-white px-5 py-3 text-sm font-bold rounded-xl active:scale-95 transition-transform shadow-lg shadow-slate-900/20"
                    >
                        Generate
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col items-center">
                        <span className="text-2xl font-black text-emerald-500">{stats.available}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Open</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col items-center">
                        <span className="text-2xl font-black text-blue-600">{stats.booked}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Booked</span>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 mb-2">Timeline</h3>

                    {loading ? (
                        <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-16 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium text-sm">No slots generated.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pb-8">
                            {slots.map((slot) => (
                                <div
                                    key={slot.id}
                                    onClick={() => handleToggle(slot.id, slot.status)}
                                    className={`
                                        group relative p-4 rounded-2xl flex justify-between items-center transition-all cursor-pointer border
                                        ${slot.status === 'AVAILABLE' ? 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md' : ''}
                                        ${slot.status === 'BOOKED' ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30' : ''}
                                        ${slot.status === 'BLOCKED' ? 'bg-slate-100 border-transparent opacity-60' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            font-mono text-sm font-bold px-3 py-1.5 rounded-lg
                                            ${slot.status === 'AVAILABLE' ? 'bg-slate-100 text-slate-600' : ''}
                                            ${slot.status === 'BOOKED' ? 'bg-white/20 text-white backdrop-blur-sm' : ''}
                                            ${slot.status === 'BLOCKED' ? 'bg-white/50 text-slate-400' : ''}
                                        `}>
                                            {format(new Date(slot.startTime), 'HH:mm')}
                                        </div>

                                        <div>
                                            {slot.status === 'BOOKED' ? (
                                                <div className="text-white">
                                                    <div className="font-bold text-sm">{slot.appointment?.patientName}</div>
                                                    <div className="text-xs opacity-80 font-medium">{slot.appointment?.patientPhone}</div>
                                                </div>
                                            ) : slot.status === 'BLOCKED' ? (
                                                <span className="text-slate-400 text-sm font-medium italic">Unavailable</span>
                                            ) : (
                                                <span className="text-slate-600 text-sm font-medium group-hover:text-blue-600 transition-colors">Available Slot</span>
                                            )}
                                        </div>
                                    </div>

                                    {slot.status === 'AVAILABLE' && (
                                        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            +
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
