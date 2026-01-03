import Link from "next/link";

export default function Home() {
  return (
    <main className="mobile-container flex flex-col justify-end pb-12 px-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-blue-50 to-transparent -z-10" />

      <div className="flex-1 flex flex-col items-center justify-center animate-slide-up">
        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-blue-500/10 flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0 duration-500">
          <span className="text-5xl">🩺</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-3">
          Medical Care<br />
          <span className="text-blue-600">Reimagined</span>
        </h1>

        <p className="text-center text-slate-500 max-w-[260px]">
          Book appointments easily and manage your health journey.
        </p>
      </div>

      <div className="space-y-4 w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Link href="/patient" className="btn btn-primary h-14 text-lg shadow-blue-600/30">
          I'm a Patient
        </Link>

        <Link href="/doctor" className="btn btn-secondary h-14 text-lg bg-white shadow-sm border border-slate-100 text-slate-600">
          Doctor Login
        </Link>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-300 font-medium tracking-widest uppercase">
          Secure • Private • Trusted
        </p>
      </div>
    </main>
  );
}
