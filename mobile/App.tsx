import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { SweetAlertProvider } from './src/context/SweetAlertContext';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <SweetAlertProvider>
        <AppNavigator />
      </SweetAlertProvider>
    </AuthProvider>
  );
}

export default App;
