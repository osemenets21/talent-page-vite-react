import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import TalentForm from "./components/TalentForm";
import SignUpForm from "./components/SignUpForm";
import React from 'react';
import ForgotPassword from "./components/ForgotPassword";
import MyProfile from "./components/MyProfile";
import NotFound from "./components/NotFound";
import SupervisorPanel from "./components/SupervisorPanel";
import { auth } from "./firebase";
import { isAdmin } from "./config/adminConfig";

function PrivateRoute({ children }) {
  const [isAuth, setIsAuth] = React.useState(null);
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuth(!!user);
    });
    return unsubscribe;
  }, []);
  if (isAuth === null) return null;
  return isAuth ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const [isAuth, setIsAuth] = React.useState(null);
  const [isAdminUser, setIsAdminUser] = React.useState(null);
  
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuth(true);
        setIsAdminUser(isAdmin(user.email));
      } else {
        setIsAuth(false);
        setIsAdminUser(false);
      }
    });
    return unsubscribe;
  }, []);
  
  if (isAuth === null || isAdminUser === null) return <div className="text-center py-16">Loading...</div>;
  if (!isAuth) return <Navigate to="/" replace />;
  if (!isAdminUser) return <div className="text-center py-16 text-red-600">Access Denied: Admin privileges required</div>;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-talent" element={
          <PrivateRoute>
            <TalentForm />
          </PrivateRoute>
        } />
        <Route path="/my-profile" element={
          <PrivateRoute>
            <MyProfile />
          </PrivateRoute>
        } />
        <Route path="/supervisor-panel" element={
          <AdminRoute>
            <SupervisorPanel />
          </AdminRoute>
        } />
        <Route path="*" element={<NotFound />} /> {/* Catch-all route */}
      </Routes>
    </Router>
  );
}
