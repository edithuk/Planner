import { AuthGuard } from './components/AuthGuard';
import { TripList } from './components/TripList';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useFirebaseSync } from './hooks/useFirebaseSync';

function App() {
  useFirebaseSync();

  return (
    <AuthGuard>
      <TripList />
      <OfflineIndicator />
    </AuthGuard>
  );
}

export default App;
