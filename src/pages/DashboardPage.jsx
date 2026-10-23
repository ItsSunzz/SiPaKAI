import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import QuickServices from '../components/QuickServices';
import ApprovalTable from '../components/ApprovalTable';
import RbacMatrix from '../components/RbacMatrix';

export default function DashboardPage({ user, documents, isLoading, loadDocuments, handleOpenModule, handleReviewDocument, handleViewDocument }) {
  const navigate = useNavigate();

  const handleModuleClick = (moduleId) => {
    if (moduleId === 'dsp01') {
      navigate('/pemusnahan/create');
    } else if (moduleId === 'dsp03') {
      navigate('/penghapusan');
    } else if (moduleId === 'dsp02') {
      navigate('/berita-acara-pemusnahan');
    } else if (moduleId === 'ho01') {
      navigate('/bast-barang');
    } else if (moduleId === 'ho02') {
      navigate('/bast-aplikasi');
    } else {
      handleOpenModule(moduleId);
    }
  };

  const onReview = (doc) => {
    if (doc?.type === 'dsp03') {
      navigate(`/penghapusan/${doc.id}`);
    } else if (doc?.type === 'dsp02') {
      navigate(`/berita-acara-pemusnahan/${doc.id}`);
    } else if (doc?.type?.startsWith('dsp') || doc?.category_type === 'pemusnahan') {
      navigate(`/pemusnahan/${doc.id}/review`);
    } else if (doc?.type === 'ho02') {
      navigate(`/bast-aplikasi/${doc.id}`);
    } else if (doc?.type === 'ho01' || doc?.category_type === 'bast') {
      navigate(`/bast-barang/${doc.id}`);
    } else if (handleReviewDocument) {
      handleReviewDocument(doc);
    }
  };

  const onView = (doc) => {
    if (doc?.type === 'dsp03') {
      navigate(`/penghapusan/${doc.id}`);
    } else if (doc?.type === 'dsp02') {
      navigate(`/berita-acara-pemusnahan/${doc.id}`);
    } else if (doc?.type?.startsWith('dsp') || doc?.category_type === 'pemusnahan') {
      navigate(`/pemusnahan/${doc.id}/review`);
    } else if (doc?.type === 'ho02') {
      navigate(`/bast-aplikasi/${doc.id}`);
    } else if (doc?.type === 'ho01' || doc?.category_type === 'bast') {
      navigate(`/bast-barang/${doc.id}`);
    } else if (handleViewDocument) {
      handleViewDocument(doc);
    }
  };

  return (
    <>
      {/* 1. Hero Banner */}
      <HeroBanner user={user} />

      {/* 2. Quick Action Cards */}
      <QuickServices onOpenModule={handleModuleClick} />

      {/* 3. Table Pending Approvals */}
      <ApprovalTable
        documents={documents}
        isLoading={isLoading}
        onRefresh={loadDocuments}
        onReviewDocument={onReview}
        onViewDocument={onView}
      />

      {/* 4. RBAC Rights Matrix */}
      <RbacMatrix currentRole={user?.role} />
    </>
  );
}
