import React, { useState } from 'react';

const Dialog = ({ children }) => {
  return <>{children}</>;
};

const DialogTrigger = ({ asChild, children, ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  return <button {...props}>{children}</button>;
};

const DialogContent = ({ children, className = '' }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-full max-h-full overflow-auto">
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className = '' }) => (
  <div className={`border-b pb-2 mb-4 ${className}`}>{children}</div>
);

const DialogTitle = ({ children, className = '' }) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
);

export { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle }; 