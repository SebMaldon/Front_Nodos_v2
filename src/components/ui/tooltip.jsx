import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}) {
  return (<TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />);
}

function Tooltip({
  ...props
}) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  asChild,
  children,
  ...props
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        {...props}
        render={(triggerProps) => {
          const child = React.Children.only(children);
          const mergedProps = { ...triggerProps, ...child.props };
          
          for (const key in child.props) {
            if (Object.prototype.hasOwnProperty.call(child.props, key)) {
              if (key.startsWith('on') && typeof child.props[key] === 'function' && typeof triggerProps[key] === 'function') {
                mergedProps[key] = (...args) => {
                  triggerProps[key](...args);
                  child.props[key](...args);
                };
              }
            }
          }
          
          if (triggerProps.className && child.props.className) {
            mergedProps.className = cn(triggerProps.className, child.props.className);
          }
          
          mergedProps.ref = (node) => {
            if (typeof triggerProps.ref === 'function') {
              triggerProps.ref(node);
            } else if (triggerProps.ref && 'current' in triggerProps.ref) {
              triggerProps.ref.current = node;
            }
            
            if (child.ref) {
              if (typeof child.ref === 'function') {
                child.ref(node);
              } else if (child.ref && 'current' in child.ref) {
                child.ref.current = node;
              }
            }
          };
          
          return React.cloneElement(child, mergedProps);
        }}
      />
    );
  }
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}>{children}</TooltipPrimitive.Trigger>;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50">
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}>
          {children}
          <TooltipPrimitive.Arrow
            className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
