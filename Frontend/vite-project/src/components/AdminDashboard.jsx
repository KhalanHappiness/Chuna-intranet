import React, { useState, useEffect } from 'react';
import { Users, FolderOpen, Link2, Download, Settings as SettingsIcon, LogOut, Shield, Check, X, Eye, Trash2 } from 'lucide-react';
import api from '../api';

const AdminDashboard = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [downloadStats, setDownloadStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoModal, setShowLogoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          const usersRes = await api.get('/admin/users');
          setUsers(usersRes.data);
          break;
        case 'repositories':
          const reposRes = await api.get('/admin/repositories');
          setRepositories(reposRes.data);
          break;
        case 'links':
          const linksRes = await api.get('/admin/share-links');
          setShareLinks(linksRes.data);
          break;
        case 'analytics':
          const statsRes = await api.get('/admin/downloads');
          setDownloadStats(statsRes.data);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, approved) => {
    try {
      await api.post(`/admin/users/${userId}/approve`, { approved });
      loadData();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleRevokeLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to revoke this share link?')) return;
    
    try {
      await api.post(`/admin/share-links/${linkId}/revoke`);
      loadData();
    } catch (error) {
      console.error('Error revoking link:', error);
    }
  };

  const UsersTab = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4">User Management</h3>
      
      {/* Pending Approvals */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-yellow-900 mb-3">Pending Approvals</h4>
        <div className="space-y-2">
          {users.filter(u => !u.is_approved).map(user => (
            <div key={user.id} className="bg-white p-3 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">Registered: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveUser(user.id, true)}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleApproveUser(user.id, false)}
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
          {users.filter(u => !u.is_approved).length === 0 && (
            <p className="text-gray-500 text-center py-4">No pending approvals</p>
          )}
        </div>
      </div>

      {/* All Users */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h4 className="font-semibold">All Users</h4>
        </div>
        <div className="divide-y">
          {users.filter(u => u.is_approved).map(user => (
            <div key={user.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {user.role === 'super_admin' ? (
                    <Shield className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role === 'super_admin' ? 'Super Admin' : 'User'}
                </span>
                <span className="text-xs text-gray-500">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RepositoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">All Repositories</h3>
        <div className="text-sm text-gray-500">
          Total: {repositories.length} repositories
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {repositories.map(repo => (
          <div key={repo.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{repo.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{repo.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{repo.files_count} files</span>
              <span>Owner: {repo.owner}</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Created {new Date(repo.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ShareLinksTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Share Links Management</h3>
        <div className="text-sm text-gray-500">
          Total: {shareLinks.length} links
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Repository</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Permission</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Views</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shareLinks.map(link => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{link.repository_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{link.token.substring(0, 20)}...</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{link.created_by}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      link.permission === 'view' ? 'bg-blue-100 text-blue-700' :
                      link.permission === 'edit' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {link.permission}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{link.view_count}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      link.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {link.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(link.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {link.is_active && (
                      <button
                        onClick={() => handleRevokeLink(link.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const AnalyticsTab = () => {
    const totalDownloads = downloadStats.reduce((sum, stat) => sum + stat.download_count, 0);
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Download Analytics</h3>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Downloads</p>
              <p className="text-3xl font-bold text-blue-600">{totalDownloads}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Downloads by Repository</h4>
          </div>
          <div className="divide-y">
            {downloadStats.map(stat => (
              <div key={stat.repository_id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{stat.repository_name}</p>
                  <p className="text-sm text-gray-500">Repository ID: {stat.repository_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-2xl font-bold text-blue-600">{stat.download_count}</span>
                  <span className="text-sm text-gray-500">downloads</span>
                </div>
              </div>
            ))}
            {downloadStats.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No download data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LogoModal = () => {
    const [logoType, setLogoType] = useState('main');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
      if (!selectedFile) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        formData.append('type', logoType);

        await api.post('/admin/settings/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        alert('Logo uploaded successfully!');
        setShowLogoModal(false);
        window.location.reload(); // Reload to show new logo
      } catch (error) {
        console.error('Error uploading logo:', error);
        alert('Failed to upload logo');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Upload Logo</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Logo Type</label>
            <select
              value={logoType}
              onChange={(e) => setLogoType(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="main">Main Logo (Admin Dashboard)</option>
              <option value="login">Login Page Logo</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Logo File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full p-3 border rounded-lg"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLogoModal(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <SettingsIcon className="w-4 h-4" />
              Change Logo
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'repositories', label: 'Repositories', icon: FolderOpen },
              { id: 'links', label: 'Share Links', icon: Link2 },
              { id: 'analytics', label: 'Analytics', icon: Download }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'repositories' && <RepositoriesTab />}
            {activeTab === 'links' && <ShareLinksTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </>
        )}
      </div>

      {showLogoModal && <LogoModal />}
    </div>
  );
};

export default AdminDashboard;