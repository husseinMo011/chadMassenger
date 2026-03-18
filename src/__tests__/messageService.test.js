// messageService.test.js
// Unit tests for src/services/messageService.js
// Framework: Jest with mocked apiClient

import { getMessages } from '../services/messageService';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

import apiClient from '../services/apiClient';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 3.3.1 Fetch Messages for a Room ─────────────────────────────────────────
describe('messageService.getMessages', () => {
  test('3.3.1 - sends POST to /api/messages/get-messages with contactId and returns messages', async () => {
    // Arrange
    const mockMessages = [{ content: 'Hello', sender: 'user1', timestamp: '2026-03-01T10:00:00Z' }];
    apiClient.post.mockResolvedValue({ data: { messages: mockMessages } });

    // Action
    const result = await getMessages('room456');

    // Assert
    expect(apiClient.post).toHaveBeenCalledWith('/api/messages/get-messages', { id: 'room456' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('Hello');
  });

  // ─── 3.3.2 Fetch Messages for Empty Room ───────────────────────────────────
  test('3.3.2 - returns empty array when room has no message history', async () => {
    // Arrange
    apiClient.post.mockResolvedValue({ data: { messages: [] } });

    // Action
    const result = await getMessages('emptyRoom');

    // Assert
    expect(result.messages).toHaveLength(0);
  });
});
