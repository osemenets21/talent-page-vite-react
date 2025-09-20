import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import logoUrl from "../pictures/logo.png";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTalents: '--',
    activeEvents: '--',
    loading: true
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
  // ...removed console.error
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [talentsResponse, eventsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_DOMAIN}/talent/stats`),
          fetch(`${import.meta.env.VITE_API_DOMAIN}/events/stats`)
        ]);

        let totalTalents = '--';
        let activeEvents = '--';

        if (talentsResponse.ok) {
          const talentsData = await talentsResponse.json();
          totalTalents = talentsData.total || 0;
        }

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          activeEvents = eventsData.active || 0;
        }

        setStats({
          totalTalents,
          activeEvents,
          loading: false
        });
      } catch (error) {
        setStats({
          totalTalents: 'Error',
          activeEvents: 'Error',
          loading: false
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                className="h-12 w-auto"
                src={logoUrl}
                alt="Lucky Hospitality"
              />
            </div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                Admin Dashboard
              </h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Admin Panel
          </h2>
          <p className="text-lg text-gray-600">
            Select the section you want to manage
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Talent Data Management */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                Talent Data Manager
              </h3>
              <p className="text-gray-600 text-center mb-6">
                View, edit, and manage talent profiles, submissions, and performer data
              </p>
              <button
                onClick={() => navigate('/supervisor-panel')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Open Talent Manager
              </button>
            </div>
          </div>

          {/* Events Content Manager */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                Events Content Manager
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Create, edit, and manage events, schedules, and promotional content
              </p>
              <button
                onClick={() => navigate('/events-content-manager')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Open Events Manager
              </button>
            </div>
          </div>

        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Quick Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.loading ? '...' : stats.totalTalents}
              </div>
              <div className="text-gray-600">Total Talents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.loading ? '...' : stats.activeEvents}
              </div>
              <div className="text-gray-600">Active Events</div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
