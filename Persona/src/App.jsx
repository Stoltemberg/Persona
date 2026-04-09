import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AppRouter } from './app/router/AppRouter';

function App() {
  return (
    <HelmetProvider>
      <AppRouter />
    </HelmetProvider>
  );
}

export default App;
