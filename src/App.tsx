import { AuthGuard } from './components/AuthGuard';
import { TripList } from './components/TripList';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Chatbot } from './components/Chatbot';
import { useFirebaseSync } from './hooks/useFirebaseSync';

function App() {
  useFirebaseSync();

  return (
    <AuthGuard>
      <TripList />
      <OfflineIndicator />
      <Chatbot />
    </AuthGuard>
  );
}

export default App;
