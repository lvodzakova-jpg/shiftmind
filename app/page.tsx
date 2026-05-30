'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const languages = [
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
];

export default function LanguagePicker() {
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('shiftmind_language');
    if (saved) router.push('/dashboard');
  }, [router]);

  const selectLanguage = (code: string) => {
    localStorage.setItem('shiftmind_language', code);
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a00 0%, #2C1810 50%, #1a0a00 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>☕</div>
        <h1 style={{ color: '#D4A96A', fontSize: '2.5rem', fontWeight: '700', margin: '0 0 0.5rem' }}>ShiftMind</h1>
        <p style={{ color: '#a07850', fontSize: '1rem', margin: 0 }}>AI shift scheduling · Select your language</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.75rem',
        maxWidth: '900px',
        width: '100%',
      }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => selectLanguage(lang.code)}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(212,169,106,0.2)',
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '500',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,169,106,0.2)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A96A';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,169,106,0.2)';
            }}
          >
            <span style={{ fontSize: '1.75rem' }}>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}