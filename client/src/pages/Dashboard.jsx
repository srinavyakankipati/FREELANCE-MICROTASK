import React from 'react';
import { useAuth } from '../context/AuthContext';
import PosterDashboard from './dashboards/PosterDashboard';
import FreelancerDashboard from './dashboards/FreelancerDashboard';
import AdminDashboard from './AdminDashboard';
import LoadingState from '../components/common/LoadingState';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'client') {
    return <PosterDashboard />;
  }

  // Default to freelancer console
  return <FreelancerDashboard />;
};

export default Dashboard;
