import { Toaster as SonnerToaster } from 'sonner';

function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgb(15 23 42)',
          border: '1px solid rgb(51 65 85)',
          color: 'rgb(226 232 240)',
        },
      }}
    />
  );
}

export { Toaster };
