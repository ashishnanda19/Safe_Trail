import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import './index.css';

import { router } from './router';
import { queryClient } from './lib/queryClient';
import AppShell from './components/layout/AppShell';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true }}
      />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            maxWidth: '380px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
          error: { iconTheme: { primary: '#E53E6D', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);

