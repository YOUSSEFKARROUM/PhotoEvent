import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { getToken, getTokenPayload, isTokenExpired } from '@/utils/auth';
import { useAuth } from '@/contexts/AuthContext';
import { testBackendConnection, testUploadEndpoint } from '@/utils/apiTest';

export const DebugPanel = ({ isVisible = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  if (!isVisible) return null;

  const token = getToken();
  const tokenPayload = token ? getTokenPayload(token) : null;
  const isExpired = token ? isTokenExpired(token) : true;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const runBackendTest = async () => {
    setIsTesting(true);
    try {
      const result = await testBackendConnection();
      setTestResults(prev => ({ ...prev, backend: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, backend: { success: false, error: error.message } }));
    } finally {
      setIsTesting(false);
    }
  };

  const runUploadTest = async () => {
    setIsTesting(true);
    try {
      const token = getToken();
      if (!token) {
        setTestResults(prev => ({ ...prev, upload: { success: false, error: 'Aucun token disponible' } }));
        return;
      }
      const result = await testUploadEndpoint(token);
      setTestResults(prev => ({ ...prev, upload: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, upload: { success: false, error: error.message } }));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-gray-900 text-white border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔧 Debug Panel</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs p-1 h-6"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? '✅ Authentifié' : '❌ Non authentifié'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Token:</span>
            <span className={token ? 'text-green-400' : 'text-red-400'}>
              {token ? '✅ Présent' : '❌ Absent'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Expiration:</span>
            <span className={isExpired ? 'text-red-400' : 'text-green-400'}>
              {isExpired ? '❌ Expiré' : '✅ Valide'}
            </span>
          </div>
          
          {isExpanded && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <div>
                <span className="text-gray-400">User ID:</span>
                <div className="text-xs font-mono bg-gray-800 p-1 rounded mt-1">
                  {user?.userId || 'N/A'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-400">Email:</span>
                <div className="text-xs font-mono bg-gray-800 p-1 rounded mt-1">
                  {user?.email || 'N/A'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-400">Role:</span>
                <div className="text-xs font-mono bg-gray-800 p-1 rounded mt-1">
                  {user?.role || 'N/A'}
                </div>
              </div>
              
              {tokenPayload && (
                <>
                  <div>
                    <span className="text-gray-400">Token exp:</span>
                    <div className="text-xs font-mono bg-gray-800 p-1 rounded mt-1">
                      {formatDate(tokenPayload.exp)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Token iat:</span>
                    <div className="text-xs font-mono bg-gray-800 p-1 rounded mt-1">
                      {formatDate(tokenPayload.iat)}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(token || 'No token')}
                  className="text-xs h-6"
                >
                  Copy Token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(tokenPayload, null, 2))}
                  className="text-xs h-6"
                >
                  Copy Payload
                </Button>
              </div>
              
              {/* Tests de connectivité */}
              <div className="pt-2 border-t border-gray-700">
                <h4 className="text-gray-400 mb-2">Tests de connectivité:</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runBackendTest}
                    disabled={isTesting}
                    className="text-xs h-6 w-full"
                  >
                    {isTesting ? 'Test...' : 'Test Backend'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runUploadTest}
                    disabled={isTesting || !token}
                    className="text-xs h-6 w-full"
                  >
                    {isTesting ? 'Test...' : 'Test Upload'}
                  </Button>
                  
                  {/* Affichage des résultats */}
                  {testResults.backend && (
                    <div className={`text-xs p-1 rounded ${testResults.backend.success ? 'bg-green-900' : 'bg-red-900'}`}>
                      <div>Backend: {testResults.backend.success ? '✅ OK' : '❌ Erreur'}</div>
                      {!testResults.backend.success && (
                        <div className="text-red-300">{testResults.backend.error || `Status: ${testResults.backend.status}`}</div>
                      )}
                    </div>
                  )}
                  
                  {testResults.upload && (
                    <div className={`text-xs p-1 rounded ${testResults.upload.success ? 'bg-green-900' : 'bg-red-900'}`}>
                      <div>Upload: {testResults.upload.success ? '✅ OK' : '❌ Erreur'}</div>
                      {!testResults.upload.success && (
                        <div className="text-red-300">{testResults.upload.error || `Status: ${testResults.upload.status}`}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
