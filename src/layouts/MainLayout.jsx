import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';

export default function MainLayout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mapping paths to menu keys for the Sidebar
  const getActiveMenu = () => {
    if (location.pathname.startsWith('/pengaturan')) return 'pengaturan';
    if (location.pathname.startsWith('/penghapusan')) return 'dsp03';
    if (location.pathname.startsWith('/pemusnahan')) return 'dsp01';
    if (location.pathname === '/') return 'beranda';
    return '';
  };

  const handleSelectMenu = (menu) => {
    if (menu === 'beranda') navigate('/');
    else if (menu === 'dsp01') navigate('/pemusnahan');
    else if (menu === 'dsp03') navigate('/penghapusan');
    else if (menu === 'dsp02') navigate('/pemusnahan');
    else if (menu === 'pengaturan') navigate('/pengaturan');
    else alert('Menu ini belum diimplementasikan di versi routing baru.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      <Sidebar 
        activeMenu={getActiveMenu()} 
        onSelectMenu={handleSelectMenu} 
        currentRole={user?.role || 'user'} 
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen max-w-full overflow-hidden">
        <TopNavbar 
          currentRole={user?.role} 
          onRoleChange={() => {}} 
          user={user} 
          onLogout={onLogout} 
        />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
