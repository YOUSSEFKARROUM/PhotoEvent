import React from "react";

const Checkbox = React.forwardRef(({ className = '', checked, onChange, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={`h-5 w-5 rounded border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    checked={checked}
    onChange={onChange}
    {...props}
  />
));

Checkbox.displayName = "Checkbox";

export { Checkbox }; 