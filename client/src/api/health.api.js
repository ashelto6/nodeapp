import { request } from './client';

// Feature-scoped API module: pages import these functions, never fetch().
function getHealth() {
  return request('/api/health');
}

export { getHealth };
