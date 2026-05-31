import geoLogo from '../../logo/GEO LOGO.png';

export default function AppLoader({ message = 'Loading…' }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-app-bg">
      {/* Logo */}
      <img
        src={geoLogo}
        alt="GEO Packs"
        className="w-36 h-auto object-contain mb-10"
      />

      {/* Bouncing dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-navy"
            style={{
              animation: 'apploader-bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-[11px] font-semibold tracking-[0.12em] uppercase text-navy-light">
        {message}
      </p>

      <style>{`
        @keyframes apploader-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
