// frontend/app/lib/api.ts

// Recupera la variabile d'ambiente impostata su Railway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const getApiUrl = (path: string) => {
  // Rimuovi slash iniziale se presente per evitare doppi slash (es. //api)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};