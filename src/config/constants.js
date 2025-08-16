// Configuration globale de l'application
export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 10000,
  MAX_RETRY: 3
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILES_PER_UPLOAD: 10
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  CONSENT_GIVEN: 'consent_given',
  THEME: 'theme'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  EVENTS: '/events',
  MY_PHOTOS: '/my-photos',
  UPLOAD: '/upload',
  ADMIN: '/admin',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_USERS: '/admin/users',
  ADMIN_PHOTOS: '/admin/photos'
};

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export const ANIMATIONS = {
  FADE_IN: { opacity: 0, y: 20 },
  FADE_IN_VISIBLE: { opacity: 1, y: 0 },
  SCALE_IN: { opacity: 0, scale: 0.95 },
  SCALE_IN_VISIBLE: { opacity: 1, scale: 1 },
  SLIDE_UP: { opacity: 0, y: 30 },
  SLIDE_UP_VISIBLE: { opacity: 1, y: 0 }
};

export const COLORS = {
  PRIMARY: 'from-blue-600 to-indigo-600',
  PRIMARY_HOVER: 'from-blue-700 to-indigo-700',
  SUCCESS: 'from-green-600 to-emerald-600',
  SUCCESS_HOVER: 'from-green-700 to-emerald-700',
  WARNING: 'from-yellow-500 to-orange-500',
  DANGER: 'from-red-500 to-pink-500'
};

// Configuration des constantes de l'application

// Timeouts et délais
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 secondes
  TOKEN_REFRESH_WARNING: 600, // 10 minutes avant expiration
  TOKEN_SAFETY_MARGIN: 300, // 5 minutes de marge de sécurité
  UPLOAD_TIMEOUT: 60000, // 1 minute pour l'upload
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Session expirée. Veuillez vous reconnecter.',
  TOKEN_EXPIRED: 'Token expiré. Veuillez vous reconnecter.',
  AUTHENTICATION_FAILED: 'Échec de l\'authentification. Veuillez réessayer.',
  NETWORK_ERROR: 'Erreur de réseau. Vérifiez votre connexion.',
  UPLOAD_FAILED: 'Échec de l\'upload. Veuillez réessayer.',
  PERMISSION_DENIED: 'Permission refusée. Contactez l\'administrateur.',
};

// Codes d'erreur HTTP
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Configuration des tokens
export const TOKEN_CONFIG = {
  STORAGE_KEY: 'token',
  BACKUP_STORAGE_KEY: 'authToken',
  REFRESH_THRESHOLD: 600, // 10 minutes avant expiration
  SAFETY_MARGIN: 300, // 5 minutes de marge
};

// Configuration des retry
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  DELAY_BETWEEN_ATTEMPTS: 1000, // 1 seconde
  BACKOFF_MULTIPLIER: 2,
};
