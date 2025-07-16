import React from 'react';
import { cn } from '../../lib/utils';

const Sheet = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
};

const SheetTrigger = ({ children, asChild, ...props }) => {
  return React.cloneElement(children, props);
};

const SheetContent = ({ children, side = "right", className, ...props }) => {
  return (
    <div className={cn("h-full p-6", className)} {...props}>
      {children}
    </div>
  );
};

export { Sheet, SheetTrigger, SheetContent }; 