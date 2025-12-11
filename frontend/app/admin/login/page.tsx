// frontend/app/admin/login/page.tsx
'use client';
import { useState, useEffect } from 'react'; // AGGIUNTO useEffect
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// NOTA BENE: "export default" è obbligatorio qui!
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Stato di caricamento iniziale
  const router = useRouter();

  // -------------------------------------------------------------------
  // NUOVA FUNZIONE: CONTROLLO SESSIONE INVERSO (PER EVITARE IL LOOP)
  // -------------------------------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include' 
        });

        if (res.ok) {
          // Se la sessione è valida, reindirizza IMMEDIATAMENTE alla dashboard.
          router.replace('/admin/dashboard'); // Usiamo replace per non salvare la pagina di login nella cronologia
        } else {
          // Se 401/403/errore, mostra il form.
          setLoading(false); 
        }
      } catch (err) {
        // Errore di connessione (server spento)
        setLoading(false); 
      }
    };
    
    checkSession();
  }, [router]);
  // -------------------------------------------------------------------


  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');

    // Il controllo apiUrl è già corretto nel file
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Necessario per inviare e ricevere il cookie JWT
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Login riuscito! Reindirizza solo dopo l'impostazione del cookie
        if (data.user.role === 'ADMIN') {
          router.replace('/admin/dashboard'); // Usiamo replace anche qui
        } else {
          router.replace('/staff/dashboard'); 
        }
      } else {
        setError(data.error || 'Credenziali non valide');
      }
    } catch (err) {
      setError('Errore di connessione al server');
    }
  };

  // Se è in fase di verifica o se il server è spento, mostra caricamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Verifica Sessione in corso...
      </div>
    );
  }

  // Se l'utente non è loggato, mostra il form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Staff Access</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition"
          >
            Entra
          </button>
        </form>
      </div>
    </div>
  );
}