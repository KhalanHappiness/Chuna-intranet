
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Upload, Eye, Edit, Shield, AlertCircle, Image, Video, FileText } from 'lucide-react';
import { getSharedRepository, uploadFile } from '../api';
import { API_BASE_URL } from '../api'; 
import axios from 'axios';

const SharedLinkView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [repository, setRepository] = useState(null);
  const [permission, setPermission] = useState('view');
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');


  useEffect(() => {
    loadSharedRepository();
  }, [token]);

const loadSharedRepository = async (userEmail = null) => {
  if (!token) {
    setError('No share token provided');
    setLoading(false);
    return;
  }

  try {
    console.log('Fetching shared repo with token:', token);
    const response = await (userEmail 
      ? axios.post(`${API_BASE_URL}/api/share/${token}`, { email: userEmail })
      : getSharedRepository(token)
    );

    if (response.data?.requires_email && !userEmail) {
      setShowEmailModal(true);
      setLoading(false);
      return;
    }

    console.log('Response:', response.data);
    setRepository(response.data);
    setPermission(response.data.permission);
    setLoading(false);
  } catch (err) {
    console.error('Error loading shared repository:', err);
    setError(err.response?.data?.error || 'Unable to load repository');
    setLoading(false);
  }
};

const EmailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Enter Your Email</h3>
        <p className="text-gray-600 mb-4">Please provide your email to access this repository</p>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full p-3 border rounded-lg mb-4"
        />
        
        <button
          onClick={() => {
            setShowEmailModal(false);
            setLoading(true);
            loadSharedRepository(email);
          }}
          disabled={!email}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );

const handleDownload = async (fileId, filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
      method: 'GET',
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
    } else {
      console.error('Download failed');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};


  const getFileIcon = (type) => {
    if (type === 'jpg' || type === 'png' || type === 'gif') {
      return <Image className="w-8 h-8 text-green-500" />;
    } else if (type === 'mp4' || type === 'mov' || type === 'avi') {
      return <Video className="w-8 h-8 text-purple-500" />;
    } else {
      return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const PermissionBadge = () => {
    const badges = {
      view: { icon: Eye, text: 'View Only', color: 'bg-green-100 text-green-700' },
      edit: { icon: Edit, text: 'Can Edit', color: 'bg-green-100 text-green-700' },
      admin: { icon: Shield, text: 'Admin Access', color: 'bg-purple-100 text-purple-700' }
    };
    
    const { icon: Icon, text, color } = badges[permission];
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color} text-sm font-medium`}>
        <Icon className="w-4 h-4" />
        {text}
      </div>
    );
  };

  const UploadModal = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
      if (!selectedFile) return;
      
      setUploading(true);
      try {
        await uploadFile(repository.id, selectedFile, '');
        setShowUploadModal(false);
        loadSharedRepository();
      } catch (error) {
        console.error('Error uploading:', error);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-xl font-bold mb-4">Upload Files</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
            >
              Browse Files
            </label>
            {selectedFile && <p className="mt-4 text-sm">{selectedFile.name}</p>}
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared repository...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

if (!repository) {
return showEmailModal ? <EmailModal /> : null;
}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {repository.files?.length || 0} files
              </p>
            </div>
            <PermissionBadge />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {repository.description && (
          <div className="bg-white rounded-lg p-4 mb-6 border">
            <p className="text-gray-700">{repository.description}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">Shared Repository Access</h4>
              <p className="text-sm text-green-800">
                {permission === 'view' && 'You can view and download files from this repository.'}
                {permission === 'edit' && 'You can view, download, and upload files to this repository.'}
                {permission === 'admin' && 'You have full access to manage this repository.'}
              </p>
            </div>
          </div>
        </div>

        {(permission === 'edit' || permission === 'admin') && (
          <div className="mb-6">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Files ({repository.files?.length || 0})</h3>
          </div>
          
          <div className="divide-y">
            {repository.files?.map((file) => (
              <div
                key={file.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{file.filename}</h4>
                    <p className="text-sm text-gray-500">
                      {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <button 
                    onClick={() => handleDownload(file.id, file.filename)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                    <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showEmailModal && <EmailModal />}
      {showUploadModal && <UploadModal />}

    </div>
  );
};

export default SharedLinkView;