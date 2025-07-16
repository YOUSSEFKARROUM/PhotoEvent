import React from 'react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  // Filtrer les enfants pour ne garder que les <option> (SelectItem)
  const validChildren = React.Children.toArray(children).filter(child => {
    // Si c'est un élément React, on vérifie le type
    if (React.isValidElement(child)) {
      return child.type === 'option' || (child.type && child.type.displayName === 'SelectItem');
    }
    return false;
  });
  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
      {...props}
    >
      {validChildren}
    </select>
  );
});

Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, ...props }) => (
  <span {...props}>
    {props.children || placeholder}
  </span>
);

SelectValue.displayName = "SelectValue";

const SelectContent = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => (
  <option
    ref={ref}
    value={value}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-eventss-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </option>
));

SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }; 