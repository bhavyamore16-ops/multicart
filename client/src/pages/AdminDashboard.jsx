import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Store, Shield, CheckCircle2, XCircle, AlertCircle, RefreshCw, DollarSign, TrendingUp, Search } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vendors');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample dynamic vendor state for presentation
  const [vendorsList, setVendorsList] = useState([
    {
      id: 'vnd-app-1',
      storeName: 'Urban Threads & Co.',
      applicantName: 'Kavita Sen',
      email: 'urban.threads@example.com',
      phone: '+91 98000 00004',
      address: 'Fashion Street, Bandra West, Mumbai, Maharashtra',
      status: 'pending',
      date: 'Today, 2:30 PM'
    },
    {
      id: 'vnd-app-2',
      storeName: 'Apex Electronics',
      applicantName: 'Vikram Malhotra',
      email: 'apex.seller@example.com',
      phone: '+91 98000 00002',
      address: 'Plot 44, Electronic City, Bengaluru',
      status: 'approved',
      date: 'Oct 28, 2026'
    },
    {
      id: 'vnd-app-3',
      storeName: 'Casa Craft Home',
      applicantName: 'Ramesh Patel',
      email: 'casa.craft@example.com',
      phone: '+91 98000 00003',
      address: 'Heritage Industrial Zone, Jaipur',
      status: 'approved',
      date: 'Oct 15, 2026'
    }
  ]);

  // Sample user state for directory
  const [usersList, setUsersList] = useState([
    { id: 'usr-1', name: 'Super Administrator', email: 'admin@multicart.com', role: 'admin', isActive: true },
    { id: 'usr-2', name: 'Vikram Malhotra', email: 'apex.seller@example.com', role: 'vendor', isActive: true },
    { id: 'usr-3', name: 'Kavita Sen', email: 'urban.threads@example.com', role: 'vendor', isActive: true },
    { id: 'usr-4', name: 'Priya Sharma', email: 'priya.buyer@example.com', role: 'customer', isActive: true },
    { id: 'usr-5', name: 'Rohit Verma', email: 'rohit.buyer@example.com', role: 'customer', isActive: true }
  ]);

  const handleApproveVendor = (id) => {
    setVendorsList(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v));
    alert("Vendor application successfully approved! Storefront is now licensed to sell.");
  };

  const handleRejectVendor = (id) => {
    const reason = prompt("Enter rejection reason for this applicant:", "Incomplete GST or business address verification");
    if (reason) {
      setVendorsList(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected', rejectionReason: reason } : v));
      alert("Vendor application rejected.");
    }
  };

  const handleToggleUser = (id) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        if (u.role === 'admin') {
          alert("Cannot deactivate primary super administrator.");
          return u;
        }
        return { ...u, isActive: !u.isActive };
      }
      return u;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Administration Console</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Marketplace governance, vendor approvals, and user directory management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Logged in as: <strong className="text-slate-900">{user?.email}</strong></span>
        </div>
      </div>

      {/* Admin KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Users</span>
            <span className="text-2xl font-black text-slate-900">{usersList.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Pending Applications</span>
            <span className="text-2xl font-black text-amber-600">
              {vendorsList.filter(v => v.status === 'pending').length}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Platform Commission</span>
            <span className="text-2xl font-black text-slate-900">10.0%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">System Status</span>
            <span className="text-2xl font-black text-emerald-600">Secure</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'vendors' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor Onboarding Applications ({vendorsList.filter(v => v.status === 'pending').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory &amp; RBAC Control</span>
        </button>
      </div>

      {/* Tab 1: Vendor Applications */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Merchant Verification Queue</h3>
            <span className="text-xs text-slate-500">Only approved vendors can publish products on MultiCart</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Store Name</th>
                  <th className="p-4">Applicant / Contact</th>
                  <th className="p-4">Physical Facility</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorsList.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {vendor.storeName}
                      <span className="block text-[10px] text-slate-400 font-normal">Registered: {vendor.date}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{vendor.applicantName}</div>
                      <div className="text-slate-400 text-[11px]">{vendor.email}</div>
                      <div className="text-slate-400 text-[11px]">{vendor.phone}</div>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {vendor.address}
                    </td>
                    <td className="p-4">
                      {vendor.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {vendor.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {vendor.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {vendor.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApproveVendor(vendor.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectVendor(vendor.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Registered Users &amp; Permissions</h3>
            <span className="text-xs text-slate-500">Super Administrator access to modify user privileges</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {u.name}
                      <span className="block text-slate-400 font-normal text-[11px]">{u.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'vendor'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.isActive
                              ? 'bg-slate-100 text-rose-600 hover:bg-rose-50'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
