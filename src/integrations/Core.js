export const UploadFile = async (file, onProgress) => {
  // Simulation d'un upload de fichier
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        if (typeof onProgress === 'function') onProgress(progress);
        // Simuler une URL d'image
        const imageUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`;
        resolve({
          url: imageUrl,
          id: Math.floor(Math.random() * 1000),
          uploaded_at: new Date().toISOString()
        });
      } else {
        if (typeof onProgress === 'function') onProgress(progress);
      }
    }, 200);
  });
};