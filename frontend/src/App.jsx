import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage from './pages/ProjectFormPage';
import GenericRegisterPage from './pages/GenericRegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<ProjectFormPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/edit" element={<ProjectFormPage />} />

        {/* Registers */}
        <Route path="/contracts" element={<GenericRegisterPage registerType="contracts" />} />
        <Route path="/progress" element={<GenericRegisterPage registerType="progress" />} />
        <Route path="/milestones" element={<GenericRegisterPage registerType="milestones" />} />
        <Route path="/deliverables" element={<GenericRegisterPage registerType="deliverables" />} />
        <Route path="/financials" element={<GenericRegisterPage registerType="financials" />} />
        <Route path="/resources" element={<GenericRegisterPage registerType="resources" />} />
        <Route path="/risks" element={<GenericRegisterPage registerType="risks" />} />
        <Route path="/issues" element={<GenericRegisterPage registerType="issues" />} />
        <Route path="/interventions" element={<GenericRegisterPage registerType="interventions" />} />
        <Route path="/recovery" element={<GenericRegisterPage registerType="recovery" />} />
        <Route path="/forward-look" element={<GenericRegisterPage registerType="forward-look" />} />
        <Route path="/users" element={<GenericRegisterPage registerType="users" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
