'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/modal';
import { toast } from 'react-toastify';

interface Meetup {
  _id: string;
  title: string;
  date: string;
  description: string;
  images: string[];
  location: string;
  createdAt: string;
}

export default function MeetupsPage() {
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      // Fetch from your MongoDB endpoint
      const response = await fetch('/api/meetups/upload');
      
      if (response.ok) {
        const data = await response.json();
        // Extract URLs from the MongoDB documents
        const imageUrls = data.map((img: any) => img.url);
        setImages(imageUrls);
      } else {
        console.error('Failed to fetch images from MongoDB');
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);

      const previews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleUploadButtonClick = async () => {
    if (selectedFiles.length === 0) {
      toast.info('Please select images to upload first.');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/meetups/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchImages(); // Refresh images from MongoDB
        toast.success('Images uploaded successfully!');
        // Clear selected files and previews
        setSelectedFiles([]);
        setImagePreviews([]);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData.error);
        toast.error('Failed to upload images. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error uploading images. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedImages = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteImage = async (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch('/api/meetups/delete-cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: imageToDelete }),
      });

      if (response.ok) {
        fetchImages(); // Refresh images from MongoDB
        setDeleteModalOpen(false);
        setImageToDelete(null);
        const result = await response.json();
        if (result.cloudinaryError) {
          toast.warning('Image deleted from MongoDB, but Cloudinary deletion failed');
        } else {
          toast.success('Image deleted successfully!');
        }
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData.error);
        toast.error('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error deleting image. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setImageToDelete(null);
  };

  // Initial mount check - show skeleton
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">
              Community Engagement
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              COMMUNITY MEETUPS
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Join our community events and connect with fellow customers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-64 bg-gray-200 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading images from MongoDB - show only spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="text-gray-600 mt-6 text-xl font-medium">Loading images...</p>
        </div>
      </div>
    );
  }

  // Main content - after loading
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">
            Community Engagement
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            UPLOAD MEETUP IMAGES
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Upload images from our community meetups and events
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Upload Images
            </h3>
            
            {/* Custom File Upload Area */}
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select Images
              </label>
              <div className="relative">
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploading 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                      : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                >
                  <svg className="w-10 h-10 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">WebP, JPEG, PNG (MAX. 10MB)</p>
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Selected Images ({imagePreviews.length})
                  </h4>
                  <button
                    onClick={clearSelectedImages}
                    disabled={uploading}
                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-lg shadow-md overflow-hidden">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => {
                            const newPreviews = imagePreviews.filter((_, i) => i !== index);
                            const newFiles = selectedFiles.filter((_, i) => i !== index);
                            setImagePreviews(newPreviews);
                            setSelectedFiles(newFiles);
                          }}
                          className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg flex items-center justify-center"
                          title="Remove image"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {selectedFiles[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleUploadButtonClick}
                  disabled={uploading}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {uploading ? 'Uploading...' : `Upload ${imagePreviews.length} Image${imagePreviews.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Images Gallery */}
        {images.length > 0 && (
          <div className="max-w-6xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Uploaded Images ({images.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Meetup image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg"
                      title="Delete image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No images message */}
        {images.length === 0 && (
          <div className="text-center mt-12 py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mt-4 text-lg">No images uploaded yet</p>
            <p className="text-gray-500 mt-2">Start by uploading some images above!</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
        size="small"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Image
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this image? This action cannot be undone.
          </p>
          
          {imageToDelete && (
            <div className="mb-6">
              <img
                src={imageToDelete}
                alt="Image to delete"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={cancelDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}