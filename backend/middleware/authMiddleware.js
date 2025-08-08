import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification JWT centralisé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Token manquant' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Format de token invalide' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let errorMessage = 'Token invalide';
      if (err.name === 'TokenExpiredError') {
        errorMessage = 'Token expiré';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = 'Token malformé';
      }
      
      return res.status(401).json({ 
        success: false,
        message: errorMessage, 
        details: err.message,
        code: err.name 
      });
    }
    
    req.user = user;
    next();
  });
};

export {
  authenticateToken
}; 