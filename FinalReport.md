# ChadMessenger — Final Project Report
**CS 314 Elements of Software Engineering, Winter 2026**
**Nimo Al-Azzawi | Individual Project — Frontend Focus**

---

## Overview

ChadMessenger is a real-time instant messaging web application built with React and Vite. It connects to a TA-provided backend over ngrok and uses Socket.IO for live message delivery. The frontend handles user authentication, profile setup, contact management, and real-time direct messaging between users.

**GitHub Repository:** [https://github.com/NimoAzzawi/chadmassenger](https://github.com/NimoAzzawi/chadmassenger)

---

## Code Structure

```
chadmassenger/
├── src/
│   ├── components/
│   │   ├── AuthPage.jsx          # Login and signup forms with animated UI
│   │   ├── ProfileSetup.jsx      # First/last name entry after registration
│   │   ├── ChatLayout.jsx        # Main layout: NavBar + sidebar + chat window
│   │   ├── ChatWindow.jsx        # Message display, input, and real-time rendering
│   │   ├── ContactSidebar.jsx    # Contact list, search, unread badges, delete DM
│   │   └── ProtectedRoute.jsx    # Auth guard — redirects unauthenticated users
│   ├── context/
│   │   ├── AuthContext.jsx       # Global auth state: user, login, logout, updateProfile
│   │   ├── SocketContext.jsx     # Socket.IO connection lifecycle and message events
│   │   └── RoomContext.jsx       # Contacts, active conversation, unread counts, last messages
│   ├── services/
│   │   ├── apiClient.js          # Axios instance pointing to ngrok backend
│   │   ├── authService.js        # signup, login, logout, getUserInfo, updateProfile
│   │   ├── contactService.js     # searchContacts, getContactsForList, getAllContacts, deleteDm
│   │   ├── messageService.js     # getMessages (fetch conversation history)
│   │   └── socketService.js      # connectSocket, sendMessage, onReceiveMessage, disconnect
│   ├── __tests__/
│   │   ├── authService.test.js
│   │   ├── contactService.test.js
│   │   ├── messageService.test.js
│   │   └── socketService.test.js
│   ├── App.jsx                   # Route definitions and auth-based redirects
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global dark theme styles and animations
├── babel.config.cjs              # Babel config for Jest (JSX + ES modules)
├── jest.config.cjs               # Jest config (jsdom environment)
├── package.json
└── vite.config.js
```

### Architecture Summary

The app uses React Context API for global state management, with three providers:

| Context | Responsibility |
|---|---|
| `AuthContext` | Authenticated user object, login/logout/updateProfile actions |
| `SocketContext` | Socket.IO connection, message emission and listener registration |
| `RoomContext` | Contact list, active chat, unread counts, last message previews |

All API communication goes through a central `apiClient` (Axios instance) configured with `withCredentials: true` for cookie-based JWT authentication. Real-time messaging is handled by Socket.IO emitting a `sendMessage` event and listening for `receiveMessage` from the server.

---

## Tests Performed

Testing used **Jest** with **React Testing Library**, following the Arrange-Action-Assert pattern documented in the Test Plan.

### Unit Tests — 15 tests across 4 suites, all passing

Run with: `npm test`
Coverage report: `npm run test:coverage`

#### authService (6 tests)
| Test | Description |
|---|---|
| 3.1.1 | Successful login — POST to `/api/auth/login` returns user data |
| 3.1.2 | Failed login — 401 error is propagated correctly |
| 3.1.3 | Successful signup — POST to `/api/auth/signup` returns created user |
| 3.1.4 | Logout — POST to `/api/auth/logout` returns success message |
| — | updateProfile — POST to `/api/auth/update-profile` with firstName and lastName |

#### contactService (4 tests)
| Test | Description |
|---|---|
| 3.2.1 | searchContacts — POST to `/api/contacts/search` with searchTerm |
| — | getContactsForList — GET returns sorted contact list |
| — | getAllContacts — GET returns all registered users |
| 3.2.2 | deleteDm — DELETE to `/api/contacts/delete-dm/:dmId` |

#### messageService (2 tests)
| Test | Description |
|---|---|
| 3.3.1 | getMessages — POST to `/api/messages/get-messages` with `{id}` returns messages |
| 3.3.2 | getMessages — returns empty array for room with no history |

#### socketService (3 tests)
| Test | Description |
|---|---|
| 3.4.1 | sendMessage — emits `sendMessage` event with correct payload |
| — | sendMessage — does nothing if socket is not connected |
| 3.4.2 | onReceiveMessage — registers listener for `receiveMessage` event |

### Feature & System Testing (Manual)

Feature tests were performed manually against the live application connected to the TA backend. All core scenarios passed:

- User registration → profile setup → chat view flow
- Login with valid and invalid credentials
- Contact search and starting a new DM conversation
- Sending and receiving messages in real-time (tested across two browser tabs)
- Conversation history loading on room entry
- Deleting a DM conversation from the sidebar
- Logout and protected route redirect

**Security tests performed:**
- XSS: Sent `<script>alert("XSS")</script>` as a chat message — rendered as plain text (React JSX escaping confirmed)
- Brute force: Submitted 20 rapid failed login attempts — frontend correctly displayed each error (rate limiting is backend responsibility)
- Protected routes: Manually navigated to `/chat` without authentication — correctly redirected to `/login`

---

## Challenges Faced

### 1. Profile Picture Upload
The first major feature I attempted was allowing users to set a profile photo. I implemented a file picker in `ProfileSetup.jsx` and `ChatLayout.jsx`, converted images to base64, and tried to send them via `updateProfile`. The app immediately returned an **Internal Server Error (500)** on every save attempt.

After investigating, I discovered that the TA backend's `POST /api/auth/update-profile` endpoint only accepts `firstName`, `lastName`, and `color`. It does not accept an `image` field at all — any extra field in the payload caused the server to crash. Since I had no access to the backend source code to add support for it, I removed the entire image upload feature and cleaned up all related code from `ProfileSetup.jsx`, `ChatLayout.jsx`, `AuthContext.jsx`, and `ContactSidebar.jsx`.

### 2. Image Sending in Chat
After removing profile pictures, I tried to allow users to send images in chat. I implemented a file picker in `ChatWindow.jsx` that converted images to base64 and emitted them via Socket.IO with `messageType: "image"`. The emit call completed without error, but **the image never appeared in the chat window** for either user.

The root cause was that the TA backend only supports `messageType: "text"`. When it received an image message, it silently dropped it — it never echoed the `receiveMessage` event back to either client. Without backend support for binary or base64 image payloads, there was no way to make this work. I removed the feature entirely.

### 3. Group Chat
I investigated whether the backend had any group chat or channel endpoints. After reviewing the full Backend API spec, there were no group-related routes — only direct message endpoints. The contact list, message history, and socket events are all built around two-user DM pairs. There was no path to implementing group chat without backend changes, so I dropped the idea entirely.

### 4. Avatar Color Customization
The backend API spec listed a `color` field in the user object and suggested it could be set via `POST /api/auth/update-profile`. I implemented a color picker in the profile editor and wired it up through `authService.updateProfile`. After testing, the color field was not actually applied or persisted by the backend — the `color` value returned by `/api/auth/userinfo` did not update. Since there was no way to verify or fix this without backend access, I removed the color picker UI and left avatar colors as static values assigned per user.

### Key Lesson
Working against a black-box backend taught me to **read the API specification carefully before writing frontend code** and to **test each endpoint before building UI around it**. All four failed features were blocked by missing or undocumented backend limitations, not frontend code issues. Verifying what the backend actually supports — not just what the spec claims — should happen before building UI that depends on it.

---

## Features Implemented

### Core Requirements
- User registration and login with error display
- Profile setup (first name, last name) after signup
- Contact sidebar showing all DM conversations
- Searching for users and starting new DM conversations
- Real-time text messaging via Socket.IO
- Conversation history loaded from REST API on room entry
- Deleting DM conversations
- Logout with session clearing and route protection

### Extra Features (Beyond Base Requirements)
- **Unread message badges** — contacts show a green badge with unread count when a message arrives while viewing another conversation
- **Last message preview** — sidebar shows the most recent message text and timestamp for each contact, updating in real-time
- **Contact sorting by recency** — conversations are automatically sorted so the most recently active appears at the top
- **Avatar initials** — every user is represented by a colored circle showing their initials (e.g., "NA" for Nimo Al-Azzawi), since profile images were not supported
- **Connection status indicator** — a banner appears in the chat header if the Socket.IO connection drops, and the input is disabled until reconnected
- **Date dividers in chat** — messages are grouped by date with a centered date label between groups
- **Auto-scroll** — the chat window automatically scrolls to the latest message when new messages arrive or when switching conversations
- **Duplicate message prevention** — the socket listener checks message `_id` before appending to avoid showing the same message twice

---

## Dependencies

| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP requests to REST API |
| `socket.io-client` | Real-time messaging |
| `jest`, `babel-jest` | Unit testing framework |
| `@testing-library/react` | React component testing |
| `@testing-library/user-event` | User interaction simulation |
| `@testing-library/jest-dom` | DOM assertion matchers |
| `jest-environment-jsdom` | Browser simulation for Jest |
| `vite`, `@vitejs/plugin-react` | Dev server and build tooling |
