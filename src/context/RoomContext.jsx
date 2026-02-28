import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { getContactsForList, searchContacts, deleteDm, getAllContacts } from "../services/contactService";
import { useAuth } from "./AuthContext";

const RoomContext = createContext(null);

function roomReducer(state, action) {
  switch (action.type) {
    case "SET_CONTACTS":
      return { ...state, contacts: action.payload, contactsLoaded: true };
    case "SET_ALL_USERS":
      return { ...state, allUsers: action.payload };
    case "SET_ACTIVE": {
      // Clear unread for this contact when opening
      const newUnread = { ...state.unreadCounts };
      if (action.payload?._id) {
        delete newUnread[action.payload._id];
      }
      return { ...state, activeContact: action.payload, unreadCounts: newUnread };
    }
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "REMOVE_CONTACT": {
      const newUnread2 = { ...state.unreadCounts };
      const newLastMsgs = { ...state.lastMessages };
      delete newUnread2[action.payload];
      delete newLastMsgs[action.payload];
      return {
        ...state,
        contacts: state.contacts.filter((c) => c._id !== action.payload),
        activeContact: state.activeContact?._id === action.payload ? null : state.activeContact,
        unreadCounts: newUnread2,
        lastMessages: newLastMsgs,
      };
    }
    case "ADD_OR_UPDATE_CONTACT": {
      const exists = state.contacts.find((c) => c._id === action.payload._id);
      let updated;
      if (exists) {
        updated = state.contacts.map((c) =>
          c._id === action.payload._id ? { ...c, ...action.payload } : c
        );
      } else {
        updated = [action.payload, ...state.contacts];
      }
      return {
        ...state,
        contacts: updated.sort(
          (a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
        ),
      };
    }
    case "SET_LAST_MESSAGE": {
      const { contactId, text, timestamp } = action.payload;
      return {
        ...state,
        lastMessages: { ...state.lastMessages, [contactId]: { text, timestamp } },
        // Also update the contact's lastMessageTime so it re-sorts
        contacts: state.contacts
          .map((c) =>
            c._id === contactId ? { ...c, lastMessageTime: timestamp } : c
          )
          .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)),
      };
    }
    case "INCREMENT_UNREAD": {
      const cId = action.payload;
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [cId]: (state.unreadCounts[cId] || 0) + 1,
        },
      };
    }
    case "CLEAR_UNREAD": {
      const cleared = { ...state.unreadCounts };
      delete cleared[action.payload];
      return { ...state, unreadCounts: cleared };
    }
    default:
      return state;
  }
}

export function RoomProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(roomReducer, {
    contacts: [],
    allUsers: [],
    activeContact: null,
    searchQuery: "",
    searchResults: [],
    contactsLoaded: false,
    unreadCounts: {},    // { contactId: number }
    lastMessages: {},    // { contactId: { text, timestamp } }
  });

  // Load contacts sorted by last message time on mount
  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      try {
        const data = await getContactsForList();
        dispatch({ type: "SET_CONTACTS", payload: data.contacts || [] });
      } catch (err) {
        console.error("Failed to load contacts:", err);
        dispatch({ type: "SET_CONTACTS", payload: [] });
      }
    };
    loadContacts();
  }, [user]);

  const setActiveContact = useCallback((contact) => {
    dispatch({ type: "SET_ACTIVE", payload: contact });
  }, []);

  const setSearchQuery = useCallback((q) => {
    dispatch({ type: "SET_SEARCH", payload: q });
  }, []);

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      return;
    }
    try {
      const data = await searchContacts(term);
      dispatch({ type: "SET_SEARCH_RESULTS", payload: data.contacts || [] });
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const data = await getAllContacts();
      dispatch({ type: "SET_ALL_USERS", payload: data.contacts || [] });
    } catch (err) {
      console.error("Failed to load all users:", err);
    }
  }, []);

  const deleteContact = useCallback(async (dmId) => {
    try {
      await deleteDm(dmId);
      dispatch({ type: "REMOVE_CONTACT", payload: dmId });
    } catch (err) {
      console.error("Failed to delete DM:", err);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await getContactsForList();
      dispatch({ type: "SET_CONTACTS", payload: data.contacts || [] });
    } catch (err) {
      console.error("Failed to refresh contacts:", err);
    }
  }, []);

  const addOrUpdateContact = useCallback((contact) => {
    dispatch({ type: "ADD_OR_UPDATE_CONTACT", payload: contact });
  }, []);

  const setLastMessage = useCallback((contactId, text, timestamp) => {
    dispatch({ type: "SET_LAST_MESSAGE", payload: { contactId, text, timestamp } });
  }, []);

  const incrementUnread = useCallback((contactId) => {
    dispatch({ type: "INCREMENT_UNREAD", payload: contactId });
  }, []);

  const clearUnread = useCallback((contactId) => {
    dispatch({ type: "CLEAR_UNREAD", payload: contactId });
  }, []);

  // Filter contacts by search query
  const filteredContacts = state.contacts.filter((c) => {
    if (!state.searchQuery) return true;
    const name = `${c.firstName || ""} ${c.lastName || ""} ${c.email || ""}`.toLowerCase();
    return name.includes(state.searchQuery.toLowerCase());
  });

  return (
    <RoomContext.Provider
      value={{
        ...state,
        filteredContacts,
        setActiveContact,
        setSearchQuery,
        performSearch,
        loadAllUsers,
        deleteContact,
        refreshContacts,
        addOrUpdateContact,
        setLastMessage,
        incrementUnread,
        clearUnread,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
