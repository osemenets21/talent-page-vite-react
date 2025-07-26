import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import TalentForm from "./components/TalentForm";
import SignUpForm from "./components/SignUpForm"; 
import React from 'react'; 
import ForgotPassword from "./components/ForgotPassword";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-talent" element={<TalentForm />} />
      </Routes>
    </Router>
  );
}
