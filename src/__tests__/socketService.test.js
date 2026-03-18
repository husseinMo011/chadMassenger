// socketService.test.js
// Unit tests for src/services/socketService.js
// Framework: Jest with mocked socket.io-client

// Create a mock socket object before mocking the module
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
};

// Mock socket.io-client to return our mock socket
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock apiClient so SERVER_URL resolves without errors
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {},
  SERVER_URL: 'http://localhost:3000',
}));

import { connectSocket, sendMessage, onReceiveMessage, disconnectSocket } from '../services/socketService';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset internal socket state between tests by disconnecting
  disconnectSocket();
});

// ─── 3.4.1 Send Message Emits Correct Event ───────────────────────────────────
describe('socketService.sendMessage', () => {
  test('3.4.1 - emits "sendMessage" event with the correct message data', () => {
    // Arrange — connect to initialize the internal socket
    connectSocket();
    const messageData = { sender: 'user1', recipient: 'user2', content: 'Hello world', messageType: 'text' };

    // Action
    sendMessage(messageData);

    // Assert
    expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', messageData);
  });

  test('does not emit if socket is not connected', () => {
    // Arrange — do NOT call connectSocket(), so internal socket is null

    // Action
    sendMessage({ sender: 'user1', recipient: 'user2', content: 'test', messageType: 'text' });

    // Assert
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

// ─── 3.4.2 Receive Message Listener Registration ──────────────────────────────
describe('socketService.onReceiveMessage', () => {
  test('3.4.2 - registers a listener for the "receiveMessage" event on the socket', () => {
    // Arrange
    connectSocket();
    const callback = jest.fn();

    // Action
    onReceiveMessage(callback);

    // Assert
    expect(mockSocket.on).toHaveBeenCalledWith('receiveMessage', callback);
  });
});
