
import React, { useState, useEffect } from 'react';
import { Upload, Share2, Video, Image, Plus, Settings, Users, Calendar, Eye, Edit, Shield, LogOut } from 'lucide-react';
import { getRepositories, createRepository, getRepository, uploadFile, createShareLink } from '../api';

const Dashboard = ({ onLogout }) => {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const response = await getRepositories();
      setRepositories(response.data);
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepositoryDetails = async (repoId) => {
    try {
      const response = await getRepository(repoId);
      setSelectedRepo(response.data);
    } catch (error) {
      console.error('Error loading repository:', error);
    }
  };

  const CreateRepositoryModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      type: 'general',
    });

    const handleSubmit = async () => {
      try {
        await createRepository(formData.name, formData.description, formData.type);
        setShowCreateRepo(false);
        loadRepositories();
        setFormData({ name: '', description: '', type: 'general' });
      } catch (error) {
        console.error('Error creating repository:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Create New Repository</h3>
          <input
            type="text"
            placeholder="Repository Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4 h-24"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Repository Type</label>
            <select 
              className="w-full p-3 border rounded-lg"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="general">General Media</option>
              <option value="meeting">Meeting Updates</option>
              <option value="project">Project Files</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateRepo(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ShareModal = () => {
    const [permission, setPermission] = useState('view');
    const [expiresInDays, setExpiresInDays] = useState(null);
    const [shareUrl, setShareUrl] = useState('');

    const handleGenerateLink = async () => {
      try {
        const response = await createShareLink(
          selectedRepo.id, 
          permission, 
          expiresInDays ? parseInt(expiresInDays) : null
        );
        setShareUrl(response.data.share_url);
      } catch (error) {
        console.error('Error creating share link:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-xl font-bold mb-4">Share Repository</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Access Level</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="permission"
                  value="view"
                  checked={permission === 'view'}
                  onChange={(e) => setPermission(e.target.value)}
                  className="mr-3"
                />
                <Eye className="w-5 h-5 mr-2 text-gray-600" />
                <div>
                  <div className="font-medium">View Only</div>
                  <div className="text-sm text-gray-500">Can view files but not upload or edit</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="permission"
                  value="edit"
                  checked={permission === 'edit'}
                  onChange={(e) => setPermission(e.target.value)}
                  className="mr-3"
                />
                <Edit className="w-5 h-5 mr-2 text-gray-600" />
                <div>
                  <div className="font-medium">Edit</div>
                  <div className="text-sm text-gray-500">Can upload, view, and edit files</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="permission"
                  value="admin"
                  checked={permission === 'admin'}
                  onChange={(e) => setPermission(e.target.value)}
                  className="mr-3"
                />
                <Shield className="w-5 h-5 mr-2 text-gray-600" />
                <div>
                  <div className="font-medium">Admin</div>
                  <div className="text-sm text-gray-500">Full control including sharing and deletion</div>
                </div>
              </label>
            </div>
          </div>

          {shareUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-3 border rounded-lg bg-gray-50"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-2"
                onChange={(e) => setExpiresInDays(e.target.checked ? 7 : null)}
              />
              <span className="text-sm">Link expires in 7 days</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowShareModal(false)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button 
              onClick={handleGenerateLink}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Link
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
      setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
      if (!selectedFile) return;
      
      setUploading(true);
      try {
        await uploadFile(selectedRepo.id, selectedFile, tags);
        setShowUploadModal(false);
        loadRepositoryDetails(selectedRepo.id);
        setSelectedFile(null);
        setTags('');
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-xl font-bold mb-4">Upload Files</h3>
          
          <div className="border-2 border-dashed rounded-lg p-8 text-center mb-4">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Browse Files
            </label>
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-4">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add Tags (optional)</label>
            <input
              type="text"
              placeholder="meeting, q4, important..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div className="flex gap-3">
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">MediaRepo</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedRepo ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Repositories</h2>
              <button
                onClick={() => setShowCreateRepo(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Repository
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => {
                    setSelectedRepo(repo);
                    loadRepositoryDetails(repo.id);
                  }}
                  className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Image className="w-6 h-6 text-blue-600" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepo(repo);
                        setShowShareModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{repo.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{repo.files || 0} files</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setSelectedRepo(null)}
              className="mb-4 text-blue-600 hover:underline"
            >
              ← Back to Repositories
            </button>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedRepo.name}</h2>
                <p className="text-gray-600">{selectedRepo.files?.length || 0} files</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

           <div className="grid grid-cols-4 gap-4">
                {Array.isArray(selectedRepo.files) && selectedRepo.files.length > 0 ? (
                    selectedRepo.files.map((file) => (
                    <div key={file.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-200 flex items-center justify-center">
                        {file.file_type === 'jpg' || file.file_type === 'png' ? (
                            <Image className="w-12 h-12 text-gray-400" />
                        ) : (
                            <Video className="w-12 h-12 text-gray-400" />
                        )}
                        </div>
                        <div className="p-3">
                        <p className="text-sm font-medium truncate">{file.filename}</p>
                        <p className="text-xs text-gray-500">{file.created_at}</p>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="col-span-4 text-center py-12">
                    <p className="text-gray-500">No files yet. Click "Upload" to add files.</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>

      {showCreateRepo && <CreateRepositoryModal />}
      {showShareModal && <ShareModal />}
      {showUploadModal && <UploadModal />}
    </div>
  );
};

export default Dashboard;