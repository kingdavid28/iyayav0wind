export const normalizeCaregiver = (data) => ({
  // ... existing mappings
  experience: data.experience || 0,
});