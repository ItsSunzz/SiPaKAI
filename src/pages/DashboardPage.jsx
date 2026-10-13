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
      navigate('/pemusnahan');
    } else {
      handleOpenModule(moduleId);
    }
  };

  const onReview = (doc) => {
    if (doc?.type?.startsWith('dsp') || doc?.category_type === 'pemusnahan') {
      navigate(`/pemusnahan/${doc.id}/review`);
    } else if (handleReviewDocument) {
      handleReviewDocument(doc);
    }
  };

  const onView = (doc) => {
    if (doc?.type?.startsWith('dsp') || doc?.category_type === 'pemusnahan') {
      navigate(`/pemusnahan/${doc.id}/review`);
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
