// Presentational component: receives data as props and renders it.
// No fetching, no state — that belongs to the page that owns the data.
function HealthStatus({ health }) {
  return (
    <div>
      <p>API status: {health ? health.status : 'loading...'}</p>
      <p>Mongo: {health ? health.mongo : 'loading...'}</p>
    </div>
  );
}

export default HealthStatus;
