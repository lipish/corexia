import * as React from "react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, className }:{ open:boolean; onClose:()=>void; title?:string; children:React.ReactNode; className?:string }){
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-lg border bg-background p-4 shadow-lg", className)}>
        {title ? <h3 className="mb-2 text-lg font-semibold">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}

