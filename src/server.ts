import { getJwtSecret } from './config/env';
import { createApp } from './app';

try {
  getJwtSecret(); // fail fast on a missing or weak secret
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
