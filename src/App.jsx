import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";
import AuthPage from "./components/AuthPage";
import ProfileSetup from "./components/ProfileSetup";
import ChatLayout from "./components/ChatLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Redirect authenticated users away from auth pages
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    // If profile not set up, redirect to profile page
    if (!user.profileSetup) return <Navigate to="/profile" replace />;
    return <Navigate to="/chat" replace />;
  }

  return children;
}

// Profile route — must be authenticated but profile not yet set up
function ProfileRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.profileSetup) return <Navigate to="/chat" replace />;

  return <ProfileSetup />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Profile setup route */}
      <Route path="/profile" element={<ProfileRoute />} />

      {/* Protected routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <SocketProvider>
              <RoomProvider>
                <ChatLayout />
              </RoomProvider>
            </SocketProvider>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
