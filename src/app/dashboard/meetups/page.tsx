'use client';

import { useState, useEffect, useRef } from 'react';
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

interface ImageWithPosition {
  url: string;
  position: string;
  customPosition?: { x: number; y: number };
}

export default function MeetupsPage() {
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState<ImageWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<
    { url: string; position: string }[]
  >([]);
  const [positioningMode, setPositioningMode] = useState<number | null>(null);
  const [imagePositions, setImagePositions] = useState<{
    [key: number]: { x: number; y: number };
  }>({});
  const [isDragging, setIsDragging] = useState(false);

  const handlePositionChange = (index: number, position: string) => {
    const updatedPreviews = [...imagePreviews];
    updatedPreviews[index].position = position;
    setImagePreviews(updatedPreviews);
  };

  const getObjectFitClass = (position: string) => {
    if (position === 'contain') return 'object-contain';
    if (position === 'top') return 'object-cover object-top';
    if (position === 'bottom') return 'object-cover object-bottom';
    return 'object-cover';
  };

  const startPositioning = (index: number) => {
    console.log('Starting positioning mode for image', index);
    setPositioningMode(index);
    // Initialize position if not set
    if (!imagePositions[index]) {
      setImagePositions((prev) => ({
        ...prev,
        [index]: { x: 50, y: 50 },
      }));
    }
  };

  const savePosition = async (index: number) => {
    const position = imagePositions[index] || { x: 50, y: 50 };

    try {
      const response = await fetch('/api/meetups/upload', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: images[index].url,
          position: 'custom',
          customPosition: position,
        }),
      });

      if (response.ok) {
        // Update local state with new position
        const updatedImages = [...images];
        updatedImages[index] = {
          ...updatedImages[index],
          position: 'custom',
          customPosition: position,
        };
        setImages(updatedImages);

        // Update imagePositions to persist the saved position
        setImagePositions((prev) => ({
          ...prev,
          [index]: position,
        }));

        setPositioningMode(null);
        toast.success('Image position saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to save position:', errorData);
        toast.error('Failed to save image position');
      }
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('An error occurred while saving the position');
    }
  };

  const cancelPositioning = () => {
    setPositioningMode(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (positioningMode !== index) return;

    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    // Immediately update position on click
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setImagePositions((prev) => ({
      ...prev,
      [index]: {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (positioningMode !== index || !isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setImagePositions((prev) => ({
      ...prev,
      [index]: {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchImages();

    // Add global mouse up handler to ensure dragging stops even if mouse leaves window
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);

      // Fetch from your MongoDB endpoint
      const response = await fetch('/api/meetups/upload');

      if (response.ok) {
        const data = await response.json();
        // Map the API response to include position data and custom positions
        const imageData: ImageWithPosition[] = data.map((img: any) => ({
          url: img.url,
          position: img.position || 'center',
          customPosition: img.customPosition,
        }));
        setImages(imageData);
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

      const previews = filesArray.map((file) => ({
        url: URL.createObjectURL(file),
        position: 'center', // Default position
      }));
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

      // Add files and their positions to formData
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
        formData.append(
          'positions',
          imagePreviews[index]?.position || 'center'
        );
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
        const fileInput = document.getElementById(
          'file-upload'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData.error);
        toast.error(errorData.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('An error occurred while uploading images');
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedImages = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
    const fileInput = document.getElementById(
      'file-upload'
    ) as HTMLInputElement;
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
          toast.warning(
            'Image deleted from MongoDB, but Cloudinary deletion failed'
          );
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
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-7xl px-6 py-20 lg:px-12'>
          <div className='mb-16 text-center'>
            <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600'>
              Community Engagement
            </p>
            <h2 className='mb-4 text-4xl font-black text-gray-900 lg:text-5xl'>
              COMMUNITY MEETUPS
            </h2>
            <p className='mx-auto max-w-2xl text-lg text-gray-600'>
              Join our community events and connect with fellow customers
            </p>
          </div>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='overflow-hidden rounded-xl bg-white shadow-lg'
              >
                <div className='h-64 animate-pulse bg-gray-200'></div>
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
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='inline-block h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600'></div>
          <p className='mt-6 text-xl font-medium text-gray-600'>
            Loading images...
          </p>
        </div>
      </div>
    );
  }

  // Main content - after loading
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-6 py-20 lg:px-12'>
        {/* Section Header */}
        <div className='mb-16 text-center'>
          <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600'>
            Community Engagement
          </p>
          <h2 className='mb-4 text-4xl font-black text-gray-900 lg:text-5xl'>
            UPLOAD MEETUP IMAGES
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-gray-600'>
            Upload images from our community meetups and events
          </p>
        </div>

        {/* Upload Section */}
        <div className='mx-auto max-w-4xl'>
          <div className='rounded-xl bg-white p-8 shadow-lg'>
            <h3 className='mb-6 text-2xl font-bold text-gray-900'>
              Upload Images
            </h3>

            {/* Custom File Upload Area */}
            <div className='mb-6'>
              <label
                htmlFor='file-upload'
                className='mb-2 block text-sm font-medium text-gray-700'
              >
                Select Images
              </label>
              <div className='relative'>
                <input
                  id='file-upload'
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleFileChange}
                  disabled={uploading}
                  className='hidden'
                />
                <label
                  htmlFor='file-upload'
                  className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    uploading
                      ? 'cursor-not-allowed border-gray-300 bg-gray-50'
                      : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
                  }`}
                >
                  <svg
                    className='mb-3 h-10 w-10 text-blue-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                    />
                  </svg>
                  <p className='text-sm text-gray-600'>
                    <span className='font-semibold'>Click to upload</span> or
                    drag and drop
                  </p>
                  <p className='text-xs text-gray-500'>
                    WebP, JPEG, PNG (MAX. 10MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className='mb-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <h4 className='text-lg font-medium text-gray-900'>
                    Selected Images ({imagePreviews.length})
                  </h4>
                  <button
                    onClick={clearSelectedImages}
                    disabled={uploading}
                    className='text-sm text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    Clear All
                  </button>
                </div>
                <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className='group relative overflow-hidden rounded-lg shadow-md'
                    >
                      <Image
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        width={400}
                        height={128}
                        className={`h-32 w-full ${getObjectFitClass(preview.position)}`}
                      />
                      <div className='absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100'>
                        <button
                          onClick={() => {
                            const newPreviews = imagePreviews.filter(
                              (_, i) => i !== index
                            );
                            const newFiles = selectedFiles.filter(
                              (_, i) => i !== index
                            );
                            setImagePreviews(newPreviews);
                            setSelectedFiles(newFiles);
                          }}
                          className='rounded-full bg-red-500 p-2 text-white shadow-lg transition-opacity hover:bg-red-600'
                          title='Remove image'
                        >
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        </button>
                      </div>
                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent'></div>
                      <div className='absolute bottom-2 right-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                        <select
                          value={preview.position}
                          onChange={(e) =>
                            handlePositionChange(index, e.target.value)
                          }
                          className='rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white shadow-md'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value='center'>Center</option>
                          <option value='top'>Top</option>
                          <option value='bottom'>Bottom</option>
                          <option value='contain'>Contain</option>
                        </select>
                      </div>
                      <div className='absolute bottom-2 left-2 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white'>
                        {selectedFiles[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className='flex justify-center'>
                <button
                  onClick={handleUploadButtonClick}
                  disabled={uploading}
                  className='flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {uploading && (
                    <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                  )}
                  {uploading
                    ? 'Uploading...'
                    : `Upload ${imagePreviews.length} Image${imagePreviews.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Images Gallery */}
        {images.length > 0 && (
          <div className='mx-auto mt-12 max-w-6xl'>
            <h3 className='mb-6 text-center text-2xl font-bold text-gray-900'>
              Uploaded Images ({images.length})
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {images.map((image, index) => (
                <div
                  key={index}
                  className='group overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl'
                >
                  <div
                    className={`relative h-80 w-full overflow-hidden ${
                      positioningMode === index
                        ? isDragging
                          ? 'cursor-grabbing'
                          : 'cursor-grab'
                        : 'cursor-default'
                    }`}
                    onMouseDown={(e) => handleMouseDown(e, index)}
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onMouseUp={handleMouseUp}
                  >
                    <Image
                      src={image.url}
                      alt={`Meetup image ${index + 1}`}
                      width={400}
                      height={320}
                      className={`h-80 w-full object-cover transition-all duration-300 ${
                        positioningMode === index
                          ? 'select-none'
                          : 'group-hover:scale-105'
                      }`}
                      style={{
                        objectPosition:
                          positioningMode === index && imagePositions[index]
                            ? `${imagePositions[index].x}% ${imagePositions[index].y}%`
                            : image.position === 'custom' &&
                                image.customPosition
                              ? `${image.customPosition.x}% ${image.customPosition.y}%`
                              : image.position === 'center'
                                ? 'center'
                                : image.position === 'top'
                                  ? 'center top'
                                  : image.position === 'bottom'
                                    ? 'center bottom'
                                    : image.position === 'contain'
                                      ? 'center'
                                      : 'center',
                      }}
                      draggable={false}
                    />

                    {/* Debug info */}
                    {positioningMode === index && (
                      <div className='pointer-events-none absolute left-2 top-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                        Pos:{' '}
                        {imagePositions[index]
                          ? `${Math.round(imagePositions[index].x)}, ${Math.round(imagePositions[index].y)}`
                          : 'none'}
                      </div>
                    )}

                    <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent'></div>

                    {/* Positioning Mode Controls */}
                    {positioningMode === index ? (
                      <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
                        <div className='pointer-events-auto flex gap-4'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              savePosition(index);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className='rounded-full bg-green-500 p-3 text-white shadow-lg hover:bg-green-600'
                            title='Save position'
                          >
                            <svg
                              className='h-5 w-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelPositioning();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className='rounded-full bg-red-500 p-3 text-white shadow-lg hover:bg-red-600'
                            title='Cancel positioning'
                          >
                            <svg
                              className='h-5 w-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Position Adjustment Button */}
                        <div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startPositioning(index);
                            }}
                            className='pointer-events-auto rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600'
                            title='Adjust image position'
                          >
                            <svg
                              className='h-5 w-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Delete Button */}
                        <div className='absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageToDelete(image.url);
                              setDeleteModalOpen(true);
                            }}
                            className='rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600'
                            title='Delete image'
                          >
                            <svg
                              className='h-4 w-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                              />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No images message */}
        {images.length === 0 && (
          <div className='mt-12 py-12 text-center'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <p className='mt-4 text-lg text-gray-600'>No images uploaded yet</p>
            <p className='mt-2 text-gray-500'>
              Start by uploading some images above!
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        title='Confirm Delete'
        size='small'
      >
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            Delete Image
          </h3>
          <p className='mb-6 text-sm text-gray-500'>
            Are you sure you want to delete this image? This action cannot be
            undone.
          </p>

          {imageToDelete && (
            <div className='mb-6'>
              <Image
                src={imageToDelete}
                alt='Image to delete'
                width={400}
                height={300}
                className='h-32 w-full rounded-lg object-contain'
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}

          <div className='flex justify-center gap-3'>
            <button
              onClick={cancelDelete}
              disabled={deleting}
              className='rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className='flex items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {deleting && (
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
