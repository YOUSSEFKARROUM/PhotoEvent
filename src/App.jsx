import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './layout.jsx';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/home';
import Events from "./pages/events";
import MyPhotos from './pages/myphotos';
import Upload from './pages/upload';
import Admin from './pages/admin';
import Adminevents from './pages/adminevents';
import AdminUsers from './pages/adminusers';
import AdminPhotos from './pages/adminphotos';
import EventPhotos from "./pages/eventphotos";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/events" element={<Events />} />
        <Route path="/my-photos" element={
          <ProtectedRoute>
            <MyPhotos />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/admin/eventss" element={
          <ProtectedRoute requireAdmin>
            <Adminevents />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/photos" element={
          <ProtectedRoute requireAdmin>
            <AdminPhotos />
          </ProtectedRoute>
        } />
        <Route path="/events/:id/photos" element={<EventPhotos />} />
        <Route path="/eventsphotos" element={<EventPhotos />} />
      </Routes>
    </Layout>
  );
}

export default App; 