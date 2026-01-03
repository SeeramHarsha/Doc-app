'use client';

import { useState, useEffect } from 'react';
import { getAvailableSlots, bookSlot, getPatientAppointments } from '../actions';
import { format, addDays } from 'date-fns';
import Link from 'next/link';
// import { cn } from '@/lib/utils';

export default function PatientPortal() {
    // Login State
    const [patient, setPatient] = useState<{ name: string, phone: string } | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // App State
    const [view, setView] = useState<'BOOK' | 'MY_APPOINTMENTS'>('BOOK');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState<any[]>([]);
    const [myAppointments, setMyAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Simple calendar logic
    const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

    // --- Auth & Init ---
    useEffect(() => {
        const saved = localStorage.getItem('patient_user');
        if (saved) setPatient(JSON.parse(saved));
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || phone.length < 3) return;
        const user = { name, phone };
        localStorage.setItem('patient_user', JSON.stringify(user));
        setPatient(user);
        setSlots([]);
        setMyAppointments([]);
    };

    const handleLogout = () => {
        localStorage.removeItem('patient_user');
        setPatient(null);
    };

    // --- Data Fetching ---
    const fetchSlots = async () => {
        setLoading(true);
        const data = await getAvailableSlots(date);
        setSlots(data);
        setLoading(false);
    };

    const fetchMyAppointments = async () => {
        if (!patient) return;
        setLoading(true);
        const data = await getPatientAppointments(patient.phone);
        setMyAppointments(data);
        setLoading(false);
    };

    // Triggers
    useEffect(() => {
        if (patient && view === 'BOOK') fetchSlots();
    }, [patient, view, date]);

    useEffect(() => {
        if (patient && view === 'MY_APPOINTMENTS') fetchMyAppointments();
    }, [patient, view]);

    // --- Actions ---
    const handleBook = async (slotId: string) => {
        if (!patient || !confirm("Confirm Booking?")) return;
        setLoading(true);
        const res = await bookSlot(slotId, patient.name, patient.phone);
        setLoading(false);

        if (res.success) {
            setNotification({ type: 'success', msg: 'Appointment Confirmed!' });
            setTimeout(() => setNotification(null), 3000);
            fetchSlots();
            setView('MY_APPOINTMENTS'); // Auto switch to tickets
        } else {
            setNotification({ type: 'error', msg: res.message || 'Failed to book' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    // --- RENDERING ---

    // 1. Login View
    if (!patient) {
        return (
            <div className="mobile-container flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-sm">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-6">
                            👤
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                        <p className="text-slate-500">Sign in to book your visit.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
                            <input className="input bg-white" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Phone Number</label>
                            <input className="input bg-white" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="555-0123" required />
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-6">
                            Continue
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-sm font-medium text-slate-400">Cancel</Link>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Main Portal
    return (
        <div className="mobile-container pb-28">
            {/* Header */}
            <header className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Hi, {patient.name.split(' ')[0]}</h1>
                        <p className="text-xs font-medium text-slate-500">Find a slot that works for you</p>
                    </div>
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <span className="text-sm">👤</span>
                    </div>
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 text-white text-sm font-semibold animate-slide-up ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                    {notification.msg}
                </div>
            )}

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6">

                {view === 'BOOK' && (
                    <div className="space-y-6 animate-slide-up">

                        {/* Horizontal Date Picker */}
                        <section>
                            <div className="flex gap-3 overflow-x-auto pb-4 px-2 snap-x hide-scrollbar">
                                {next7Days.map((d) => {
                                    const dStr = format(d, 'yyyy-MM-dd');
                                    const isSelected = date === dStr;
                                    return (
                                        <button
                                            key={dStr}
                                            onClick={() => setDate(dStr)}
                                            className={`
                                                flex-shrink-0 w-[4.5rem] h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all snap-start border
                                                ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105'
                                                    : 'bg-white text-slate-600 border-slate-100'
                                                }
                                            `}
                                        >
                                            <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">{format(d, 'EEE')}</span>
                                            <span className="text-xl font-bold">{format(d, 'd')}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Slots */}
                        <section className="px-2">
                            <div className="flex justify-between items-baseline mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Available Times</h3>
                                <span className="text-xs font-medium text-slate-400">{slots.length} slots</span>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
                            ) : slots.length === 0 ? (
                                <div className="py-16 bg-white rounded-3xl text-center border-2 border-dashed border-slate-100 mx-1">
                                    <p className="text-slate-400 font-medium">No slots available.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleBook(slot.id)}
                                            className="bg-white py-4 rounded-xl border border-slate-100 text-blue-600 font-bold text-sm shadow-sm active:scale-95 transition-all hover:border-blue-200"
                                        >
                                            {format(new Date(slot.startTime), 'h:mm a')}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {view === 'MY_APPOINTMENTS' && (
                    <div className="space-y-4 animate-slide-up px-2">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Urgent Care Tickets</h2>

                        {loading ? (
                            <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
                        ) : myAppointments.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-50">
                                No tickets found.
                            </div>
                        ) : (
                            myAppointments.map((app) => (
                                <div key={app.id} className="bg-white p-0 rounded-[24px] shadow-sm border border-slate-100 overflow-hidden relative group">
                                    <div className="h-2 bg-blue-500 w-full" />
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                                <p className="text-slate-700 font-semibold">{format(new Date(app.slot.startTime), 'MMMM do, yyyy')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                                <p className="text-2xl font-bold text-slate-900">{format(new Date(app.slot.startTime), 'h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                👨‍⚕️
                                            </div>
                                            <div className="text-sm font-medium text-slate-500">Dr. General Practice</div>
                                        </div>
                                    </div>
                                    {/* Ticket decorative notch */}
                                    <div className="absolute top-[40%] -left-3 w-6 h-6 bg-[#f8fafc] rounded-full" />
                                    <div className="absolute top-[40%] -right-3 w-6 h-6 bg-[#f8fafc] rounded-full" />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="absolute bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 flex justify-around items-center border border-white/50 z-50">
                <button
                    onClick={() => setView('BOOK')}
                    className={`flex flex-col items-center justify-center w-full h-full rounded-l-2xl transition-all ${view === 'BOOK' ? 'text-blue-600' : 'text-slate-400 opacity-60'}`}
                >
                    <span className="text-xl mb-0.5">📅</span>
                    <span className="text-[10px] font-bold tracking-wide">Book</span>
                </button>
                <div className="w-[1px] h-8 bg-slate-100"></div>
                <button
                    onClick={() => setView('MY_APPOINTMENTS')}
                    className={`flex flex-col items-center justify-center w-full h-full transition-all ${view === 'MY_APPOINTMENTS' ? 'text-blue-600' : 'text-slate-400 opacity-60'}`}
                >
                    <span className="text-xl mb-0.5">🎟️</span>
                    <span className="text-[10px] font-bold tracking-wide">Tickets</span>
                </button>
                <div className="w-[1px] h-8 bg-slate-100"></div>
                <button
                    onClick={() => { if (confirm('Exit?')) handleLogout() }}
                    className="flex flex-col items-center justify-center w-full h-full rounded-r-2xl text-slate-400 opacity-60 active:text-red-500"
                >
                    <span className="text-xl mb-0.5">🚪</span>
                    <span className="text-[10px] font-bold tracking-wide">Exit</span>
                </button>
            </nav>
        </div>
    );
}
