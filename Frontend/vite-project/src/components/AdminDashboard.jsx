import React, { useState, useEffect } from 'react';
import { Users, FolderOpen, Link2, Download, Settings as SettingsIcon, LogOut, Shield, Check, X, Eye, Trash2, Plus, Upload as UploadIcon, RotateCcw, Video, Image } from 'lucide-react';

import api, { API_BASE_URL } from '../api';

const AdminDashboard = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [downloadStats, setDownloadStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateRepoModal, setShowCreateRepoModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [selectedLinkViewers, setSelectedLinkViewers] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);


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

  const handleReactivateLink = async (linkId) => {
    try {
      await api.post(`/admin/share-links/${linkId}/reactivate`);
      loadData();
      alert('Link reactivated successfully!');
    } catch (error) {
      console.error('Error reactivating link:', error);
      alert('Failed to reactivate link');
    }
  };

  const handleViewLinkViewers = async (linkId) => {
    try {
      const response = await api.get(`/admin/share-links/${linkId}/viewers`);
      setSelectedLinkViewers(response.data);
      setShowViewersModal(true);
    } catch (error) {
      console.error('Error loading viewers:', error);
      alert('Failed to load viewers');
    }
  };

  const handleDeleteRepository = async (repoId) => {
    if (!window.confirm('Are you sure you want to delete this repository? This will delete all files inside it.')) return;
    
    try {
      await api.delete(`/admin/repositories/${repoId}`);
      loadData();
      alert('Repository deleted successfully!');
    } catch (error) {
      console.error('Error deleting repository:', error);
      alert('Failed to delete repository');
    }
  };

  // Create User Modal
  const CreateUserModal = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    const [creating, setCreating] = useState(false);

    const handleSubmit = async () => {
      if (!formData.username || !formData.email || !formData.password) {
        alert('All fields are required');
        return;
      }

      setCreating(true);
      try {
        await api.post('/admin/users/create', formData);
        setShowCreateUserModal(false);
        loadData();
        alert('User created successfully!');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to create user');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Create New User</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-3 border rounded-lg"
              >
                <option value="user">User</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create Repository Modal
  const CreateRepoModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      type: 'general',
      owner_id: user.id
    });
    const [creating, setCreating] = useState(false);

    const handleSubmit = async () => {
      if (!formData.name) {
        alert('Repository name is required');
        return;
      }

      setCreating(true);
      try {
        await api.post('/admin/repositories/create', formData);
        setShowCreateRepoModal(false);
        loadData();
        alert('Repository created successfully!');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to create repository');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Create New Repository</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Repository Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter repository name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg h-24"
                placeholder="Enter description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 border rounded-lg"
              >
                <option value="general">General Media</option>
                <option value="meeting">Meeting Updates</option>
                <option value="project">Project Files</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreateRepoModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Repository'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Upload File Modal
  const UploadFileModal = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
      if (!selectedFile) {
        alert('Please select a file');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('tags', tags);

        await api.post(`/admin/repositories/${selectedRepo.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setShowUploadModal(false);
        loadData();
        alert('File uploaded successfully!');
      } catch (error) {
        alert('Failed to upload file');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Upload File to {selectedRepo?.name}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full p-3 border rounded-lg"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags (optional)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="meeting, important, etc."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowUploadModal(false)}
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

  // Viewers Modal
  const ViewersModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">Link Viewers</h3>
        
        <div className="max-h-96 overflow-y-auto">
          {selectedLinkViewers.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">IP Address</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Accessed At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedLinkViewers.map((viewer) => (
                  <tr key={viewer.id}>
                    <td className="px-4 py-3">{viewer.email || 'Anonymous'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{viewer.ip_address}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(viewer.accessed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-8">No viewers yet</p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowViewersModal(false)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">User Management</h3>
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>
      
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
          <h4 className="font-semibold">All Users ({users.filter(u => u.is_approved).length})</h4>
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

const RepositoriesTab = () => {
  const [viewingRepo, setViewingRepo] = useState(null);
  const [repoFiles, setRepoFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const handleViewRepository = async (repo) => {
    setViewingRepo(repo);
    setLoadingFiles(true);
    try {
      const response = await api.get(`/repositories/${repo.id}`);
      setRepoFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading repository files:', error);
      setRepoFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

 const handleDownload = async (fileId, filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await api.delete(`/files/${fileId}`);
      handleViewRepository(viewingRepo); // Reload files
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  if (viewingRepo) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingRepo(null)}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          ← Back to All Repositories
        </button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold">{viewingRepo.name}</h3>
            <p className="text-gray-600">{viewingRepo.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Owner: {viewingRepo.owner} • {repoFiles.length} files
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedRepo(viewingRepo);
                setShowUploadModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UploadIcon className="w-4 h-4" />
              Upload Files
            </button>
            <button
              onClick={() => handleDeleteRepository(viewingRepo.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete Repository
            </button>
          </div>
        </div>

        {loadingFiles ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : repoFiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {repoFiles.map((file) => (
              <div key={file.id} className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {file.file_type === 'jpg' || file.file_type === 'png' || file.file_type === 'jpeg' ? (
                    <img 
                      src={`${API_BASE_URL}/api/files/${file.id}/download`}
                      alt={file.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : file.file_type === 'mp4' || file.file_type === 'mov' ? (
                    <Video className="w-12 h-12 text-gray-400" />
                  ) : (
                    <Image className="w-12 h-12 text-gray-400" />
                  )}
                  
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDownload(file.id, file.original_filename)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate text-gray-900" title={file.original_filename}>
                    {file.original_filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                  </p>
                  {file.tags && (
                    <p className="text-xs text-blue-600 mt-1">{file.tags}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border">
            <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No files in this repository</h3>
            <p className="text-gray-600 mb-6">Upload files to get started</p>
            <button
              onClick={() => {
                setSelectedRepo(viewingRepo);
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              <span className="font-medium">Upload Files</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">All Repositories</h3>
        <button
          onClick={() => setShowCreateRepoModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Repository
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {repositories.map(repo => (
          <div key={repo.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-3 bg-blue-100 rounded-lg flex-1"
                onClick={() => handleViewRepository(repo)}
              >
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRepo(repo);
                    setShowUploadModal(true);
                  }}
                  className="p-2 hover:bg-blue-50 rounded-lg"
                  title="Upload files"
                >
                  <UploadIcon className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRepository(repo.id);
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title="Delete repository"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            <div onClick={() => handleViewRepository(repo)}>
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
          </div>
        ))}
      </div>
    </div>
  );
};

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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewLinkViewers(link.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="View who accessed this link"
                      >
                        <Eye className="w-3 h-3" />
                        Viewers
                      </button>
                      {link.is_active ? (
                        <button
                          onClick={() => handleRevokeLink(link.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateLink(link.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reactivate
                        </button>
                      )}
                    </div>
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
      {showCreateUserModal && <CreateUserModal />}
      {showViewersModal && <ViewersModal />}
      {showUploadModal && <UploadFileModal />}
      {showCreateRepoModal && <CreateRepoModal/>}

    </div>
  );
};

export default AdminDashboard;