// contactService.test.js
// Unit tests for src/services/contactService.js
// Framework: Jest with mocked apiClient

import {
  searchContacts,
  getAllContacts,
  getContactsForList,
  deleteDm,
} from '../services/contactService';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '../services/apiClient';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 3.2.1 Search Contacts ────────────────────────────────────────────────────
describe('contactService.searchContacts', () => {
  test('3.2.1 - sends POST to /api/contacts/search and returns matching users', async () => {
    // Arrange
    const mockContacts = [{ email: 'sarah@test.com' }];
    apiClient.post.mockResolvedValue({ data: { contacts: mockContacts } });

    // Action
    const result = await searchContacts('sarah');

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/contacts/search', { searchTerm: 'sarah' });
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe('sarah@test.com');
  });
});

// ─── getContactsForList ───────────────────────────────────────────────────────
describe('contactService.getContactsForList', () => {
  test('sends GET to /api/contacts/get-contacts-for-list and returns contacts', async () => {
    // Arrange
    apiClient.get.mockResolvedValue({ data: { contacts: [{ _id: '1' }, { _id: '2' }] } });

    // Action
    const result = await getContactsForList();

    // Assert
    expect(apiClient.get).toHaveBeenCalledWith('/api/contacts/get-contacts-for-list');
    expect(result.contacts).toHaveLength(2);
  });
});

// ─── getAllContacts ────────────────────────────────────────────────────────────
describe('contactService.getAllContacts', () => {
  test('sends GET to /api/contacts/all-contacts', async () => {
    // Arrange
    apiClient.get.mockResolvedValue({ data: { contacts: [] } });

    // Action
    await getAllContacts();

    // Assert
    expect(apiClient.get).toHaveBeenCalledWith('/api/contacts/all-contacts');
  });
});

// ─── 3.2.2 Delete DM ─────────────────────────────────────────────────────────
describe('contactService.deleteDm', () => {
  test('3.2.2 - sends DELETE to /api/contacts/delete-dm/:dmId with correct ID', async () => {
    // Arrange
    apiClient.delete.mockResolvedValue({ data: { message: 'DM deleted' } });

    // Action
    const result = await deleteDm('dm123');

    // Assert
    expect(apiClient.delete).toHaveBeenCalledWith('/api/contacts/delete-dm/dm123');
    expect(result.message).toBe('DM deleted');
  });
});
