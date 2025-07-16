import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
));
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = ({ children, open, onClose, className = '' }) => {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addeventsListener('mousedown', handleClick);
    return () => document.removeeventsListener('mousedown', handleClick);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={`absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 ${className}`}>
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = '' }) => (
  <div
    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${className}`}
    onClick={onClick}
    tabIndex={0}
    role="menuitem"
  >
    {children}
  </div>
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }; 