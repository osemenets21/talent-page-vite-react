import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import TalentForm from "./components/TalentForm";
import SignUpForm from "./components/SignUpForm";
import ForgotPassword from "./components/ForgotPassword";
import TalentProfile from "./components/TalentProfile"; // ← ADD THIS
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/register-talent"
          element={
            <PrivateRoute>
              <TalentForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/talent-profile/:submissionId" // ← SUPPORT FOR PROFILE URL
          element={
            <PrivateRoute>
              <TalentProfile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}