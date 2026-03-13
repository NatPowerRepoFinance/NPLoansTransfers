import { createRoot } from 'react-dom/client';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import './index.css';
import App from './App.tsx';
import AuthProvider from './lib/authProvider.tsx';

ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById('root')!).render(
	<AuthProvider>
		<App />
	</AuthProvider>
)