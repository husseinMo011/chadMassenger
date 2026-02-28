import apiClient from "./apiClient";

// POST /api/contacts/search
export const searchContacts = async (searchTerm) => {
  const response = await apiClient.post("/api/contacts/search", { searchTerm });
  return response.data;
};

// GET /api/contacts/all-contacts
export const getAllContacts = async () => {
  const response = await apiClient.get("/api/contacts/all-contacts");
  return response.data;
};

// GET /api/contacts/get-contacts-for-list
export const getContactsForList = async () => {
  const response = await apiClient.get("/api/contacts/get-contacts-for-list");
  return response.data;
};

// DELETE /api/contacts/delete-dm/:dmId
export const deleteDm = async (dmId) => {
  const response = await apiClient.delete(`/api/contacts/delete-dm/${dmId}`);
  return response.data;
};
