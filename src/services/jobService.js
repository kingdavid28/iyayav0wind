import axios from 'axios';

import { API_CONFIG } from '../config/constants';

const API_BASE = `${API_CONFIG.BASE_URL}/contracts`;

// Fetch jobs/contracts for the current client (parent)
const getJobsForClient = async (token) => {
  const res = await axios.get(`${API_BASE}/client`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Fetch contracts for the current provider (caregiver)
const getJobsForProvider = async (token) => {
  const res = await axios.get(`${API_BASE}/provider`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Create a new job/contract (parent posts a job)
const createJob = async (jobData, token) => {
  const res = await axios.post(`${API_BASE}`, jobData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Update contract status (e.g., accept/reject/complete)
const updateJobStatus = async (contractId, status, token) => {
  const res = await axios.patch(`${API_BASE}/${contractId}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const getJobs = async (role, token) => {
  if (!role) {
    console.error('[jobService] getJobs called with missing or undefined role:', role ?? '(undefined)');
    throw new Error('User role is missing. Please log in again.');
  }
  if (role === 'parent') {
    return getJobsForClient(token);
  } else if (role === 'caregiver' || role === 'provider') {
    return getJobsForProvider(token);
  } else {
    console.error(`[jobService] getJobs called with unknown role:`, typeof role === 'object' ? JSON.stringify(role) : role);
    throw new Error(`Unknown role for getJobs: ${role}`);
  }
};

const jobService = {
  getJobsForClient,
  getJobsForProvider,
  createJob,
  updateJobStatus,
  getJobs
};

export default jobService;

// Apply to a job (caregiver applies)
export const applyToJob = async (jobId, applicationData, token) => {
  const res = await axios.post(`${API_BASE}/${jobId}/apply`, applicationData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};