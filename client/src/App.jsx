import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', mongo: 'unknown' }));
  }, []);

  return (
    <div>
      <h1>webapp</h1>
      <p>API status: {health ? health.status : 'loading...'}</p>
      <p>Mongo: {health ? health.mongo : 'loading...'}</p>
    </div>
  );
}

export default App;
