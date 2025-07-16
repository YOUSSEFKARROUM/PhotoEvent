export const createPageUrl = (pageName, params = {}) => {
  const routes = {
    Home: '/',
    events: '/events',
    MyPhotos: '/my-photos',
    Upload: '/upload',
    Admin: '/admin',
    Adminevents: '/admin/events',
    AdminUsers: '/admin/users',
    AdminPhotos: '/admin/photos',
    eventsPhotos: '/eventsphotos',
  };
  let url = routes[pageName] || '/';
  const query = new URLSearchParams(params).toString();
  if (query) url += `?${query}`;
  return url;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 