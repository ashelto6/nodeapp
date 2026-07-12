import { useEffect, useState } from 'react';
import { getHealth } from '../api/health.api';
import HealthStatus from '../components/HealthStatus';

// Pages own data-fetching and state, and compose components to render.
function HomePage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', mongo: 'unknown' }));
  }, []);

  return (
    <div>
      <h1>webapp</h1>
      <HealthStatus health={health} />
    </div>
  );
}

export default HomePage;
