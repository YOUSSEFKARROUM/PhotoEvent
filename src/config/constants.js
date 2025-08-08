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
