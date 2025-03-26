"use client";

import { Toaster } from "react-hot-toast";

const ToasterProvider = () => {
  return ( 
    <Toaster 
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        }
      }}
    /> 
  );
}
 
export default ToasterProvider;