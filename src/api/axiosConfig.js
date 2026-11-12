// src/api/axiosConfig.js
// Static data only: this client never contacts a server and reads nothing
// from .env. Requests are answered in the browser by src/staticData.
import { createStaticClient } from '../staticData';

// Kept for code that still imports it; there is no API server.
const API_URL = '';

const axiosInstance = createStaticClient('company');

export { API_URL };
export default axiosInstance;
