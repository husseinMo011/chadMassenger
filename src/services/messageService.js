import apiClient from "./apiClient";

// POST /api/messages/get-messages
export const getMessages = async (contactId) => {
  const response = await apiClient.post("/api/messages/get-messages", { id: contactId });
  return response.data;
};
