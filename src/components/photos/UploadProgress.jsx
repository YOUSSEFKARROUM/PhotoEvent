import React from "react";

const steps = [
  { key: 'compress', label: 'Compression', icon: '📦' },
  { key: 'upload', label: 'Envoi', icon: '📤' },
  { key: 'process', label: 'Traitement IA', icon: '🤖' },
  { key: 'save', label: 'Sauvegarde', icon: '💾' }
];

export default function UploadProgress({ step = 0, progress = 0 }) {
  return (
    <div className="upload-progress w-full max-w-md mx-auto my-4">
      <div className="progress-bar h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div 
          className="progress-fill bg-gradient-to-r from-purple-500 to-pink-500 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center mb-2">
        {steps.map((s, index) => (
          <div 
            key={s.key}
            className={`flex flex-col items-center text-xs ${index <= step ? 'text-purple-700 font-bold' : 'text-slate-400'}`}
          >
            <span className="text-lg mb-1">{s.icon}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-700">
        {step < steps.length ? steps[step].label : 'Terminé'} - {progress}%
      </p>
    </div>
  );
} 