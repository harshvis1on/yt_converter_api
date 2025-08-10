import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { safeGetItem } from '../utils/localStorage';

// iTunes Categories from Apple's official list
const ITUNES_CATEGORIES = [
  'Arts', 'Business', 'Comedy', 'Education', 'Fiction', 'Government', 'Health & Fitness',
  'History', 'Kids & Family', 'Leisure', 'Music', 'News', 'Religion & Spirituality',
  'Science', 'Society & Culture', 'Sports', 'Technology', 'True Crime', 'TV & Film'
];

// Megaphone explicit content options
const EXPLICIT_OPTIONS = [
  { value: 'no', label: 'No - Clean content suitable for all audiences' },
  { value: 'clean', label: 'Clean - Family-friendly content' },
  { value: 'yes', label: 'Yes - Contains explicit content' }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export default function PodcastCreationForm({ channelData, prefillData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    // Basic Information
    title: prefillData?.title || '',
    subtitle: prefillData?.subtitle || '',
    summary: prefillData?.description || prefillData?.summary || '',
    
    // Content Details
    podcastType: prefillData?.podcastType || 'serial',
    explicit: prefillData?.explicit || 'clean', // Rating
    itunesCategories: prefillData?.itunesCategories || [prefillData?.primaryCategory || 'Technology'],
    language: prefillData?.language || 'en',
    
    // Artwork
    imageFile: prefillData?.imageFile || prefillData?.artworkUrl || '',
    customArtwork: null,
    useChannelArtwork: true,
    
    // Owner Information  
    author: prefillData?.author || '',
    ownerName: prefillData?.ownerName || '',
    ownerEmail: prefillData?.ownerEmail || '',
    link: prefillData?.link || prefillData?.websiteUrl || '', // Website link
    copyright: prefillData?.copyright || '',
    
    // Additional Settings
    keywords: prefillData?.keywords || '',
    fundingUrl: prefillData?.fundingUrl || '',
    trailerUrl: prefillData?.trailerUrl || '',
    
    // Distribution Settings
    distributionType: prefillData?.distributionType || 'audio',
    ...prefillData
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields based on Megaphone API specification
    if (!formData.title?.trim()) {
      newErrors.title = 'Podcast title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }
    
    if (!formData.subtitle?.trim()) {
      newErrors.subtitle = 'Podcast subtitle is required';
    } else if (formData.subtitle.length > 255) {
      newErrors.subtitle = 'Subtitle must be less than 255 characters';
    }
    
    if (!formData.summary?.trim()) {
      newErrors.summary = 'Summary is required';
    } else if (formData.summary.length < 50) {
      newErrors.summary = 'Summary must be at least 50 characters';
    }
    
    if (!formData.itunesCategories || formData.itunesCategories.length === 0) {
      newErrors.itunesCategories = 'At least one iTunes category is required';
    }
    
    if (!formData.language?.trim()) {
      newErrors.language = 'Language is required';
    }
    
    // Author is required per Megaphone API
    if (!formData.author?.trim()) {
      newErrors.author = 'Author name is required';
    }
    
    // Owner email is required per Megaphone API
    if (!formData.ownerEmail?.trim()) {
      newErrors.ownerEmail = 'Owner email is required';
    }

    // Optional field validation
    if (formData.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address';
    }

    // Validate URLs if provided
    if (formData.link && !/^https?:\/\/.+/.test(formData.link)) {
      newErrors.link = 'Website URL must start with http:// or https://';
    }
    
    if (formData.fundingUrl && !/^https?:\/\/.+/.test(formData.fundingUrl)) {
      newErrors.fundingUrl = 'Funding URL must start with http:// or https://';
    }
    
    if (formData.trailerUrl && !/^https?:\/\/.+/.test(formData.trailerUrl)) {
      newErrors.trailerUrl = 'Trailer URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    // Add channel and user data to form submission
    const submissionData = {
      ...formData,
      channelId: channelData?.id,
      userId: safeGetItem('user_info', {}).id,
      // Ensure both camelCase and snake_case versions for compatibility
      distribution_type: formData.distributionType, // Database field name
      distributionType: formData.distributionType,   // API field name
      // Include the final artwork URL or file data (Megaphone uses 'imageFile')
      finalArtworkUrl: formData.useChannelArtwork ? formData.imageFile : null,
      customArtworkData: !formData.useChannelArtwork && formData.customArtwork ? {
        name: formData.customArtwork.name,
        size: formData.customArtwork.size,
        dimensions: formData.customArtwork.dimensions,
        dataUrl: formData.customArtwork.preview
      } : null
    };

    onSubmit(submissionData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArtworkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Create preview and get dimensions
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        
        // Validate dimensions - Enforce 3000x3000 minimum
        if (width < 3000 || height < 3000) {
          toast.error('Image must be at least 3000x3000 pixels for Megaphone');
          return;
        }
        
        if (width !== height) {
          toast.error('Artwork must be square (same width and height)');
          return;
        }
        
        // Confirm optimal size
        if (width === 3000 && height === 3000) {
          toast.success('Perfect! 3000x3000 square artwork uploaded');
        }

        // Create file object with metadata
        const fileWithPreview = {
          file: file,
          preview: event.target.result,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          dimensions: `${width}×${height}`,
          width: width,
          height: height
        };

        handleInputChange('customArtwork', fileWithPreview);
        handleInputChange('useChannelArtwork', false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Podcast
          </h2>
          <p className="text-gray-600">
            Customize your podcast details before we create it on Megaphone
          </p>
          
          {channelData && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Source:</strong> {channelData.title} ({channelData.videoCount} videos)
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: Basic Information */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-600">Essential details about your podcast</p>
            </div>

            {/* Podcast Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your podcast title"
                maxLength="255"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Podcast Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Subtitle *
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.subtitle ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="A brief tagline for your podcast"
                maxLength="255"
              />
              {errors.subtitle && <p className="text-red-500 text-xs mt-1">{errors.subtitle}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Required subtitle that appears below your podcast title
              </p>
            </div>

            {/* Podcast Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Summary *
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows="4"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.summary ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your podcast content and what listeners can expect (minimum 50 characters)"
              />
              <p className="text-gray-500 text-xs mt-1">
                {formData.summary.length}/2000 characters (min. 50)
              </p>
              {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
            </div>
          </div>

          {/* SECTION 2: Cover Art */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cover Art</h3>
              <p className="text-sm text-gray-600">Upload square artwork - <strong>3000 x 3000 pixels minimum required</strong></p>
            </div>
            
            <div className="space-y-4">
              {/* Channel Artwork Option */}
              {formData.imageFile && (
                <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    id="channel-artwork"
                    name="artworkOption"
                    checked={formData.useChannelArtwork}
                    onChange={() => handleInputChange('useChannelArtwork', true)}
                    className="text-indigo-600"
                  />
                  <label htmlFor="channel-artwork" className="flex items-center space-x-4 cursor-pointer flex-1">
                    <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={formData.imageFile} 
                        alt="Channel artwork"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Use channel profile picture</span>
                      <p className="text-xs text-gray-500">From your YouTube channel</p>
                      <p className="text-xs text-amber-600">⚠️ May need resizing to 3000x3000</p>
                    </div>
                  </label>
                </div>
              )}
              
              {/* Custom Artwork Option */}
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <input
                    type="radio"
                    id="custom-artwork"
                    name="artworkOption"
                    checked={!formData.useChannelArtwork}
                    onChange={() => handleInputChange('useChannelArtwork', false)}
                    className="text-indigo-600 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="custom-artwork" className="text-sm font-medium text-gray-900 block mb-3 cursor-pointer">
                      Upload custom artwork (Square image required)
                    </label>
                    
                    {!formData.useChannelArtwork && (
                      <div className="space-y-4">
                        {/* Square Upload Area */}
                        <div className="flex items-start space-x-4">
                          {/* Square Visual Cue */}
                          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                            {formData.customArtwork ? (
                              <img 
                                src={formData.customArtwork.preview} 
                                alt="Custom artwork preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-center">
                                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs">3000×3000</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Upload Controls */}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleArtworkUpload}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            />
                            
                            {formData.customArtwork && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-green-900">{formData.customArtwork.name}</p>
                                    <p className="text-xs text-green-700">{formData.customArtwork.size} • {formData.customArtwork.dimensions}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange('customArtwork', null)}
                                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Requirements Alert */}
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Required Specifications</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc list-inside space-y-1">
                                  <li><strong>Minimum size:</strong> 3000 x 3000 pixels</li>
                                  <li><strong>Format:</strong> JPG or PNG</li>
                                  <li><strong>Shape:</strong> Perfect square (same width and height)</li>
                                  <li><strong>Color:</strong> RGB colorspace</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Content Details */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Content Details</h3>
              <p className="text-sm text-gray-600">Define your podcast type, rating, and categories</p>
            </div>

            {/* Podcast Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Podcast Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="serial"
                    checked={formData.podcastType === 'serial'}
                    onChange={(e) => handleInputChange('podcastType', e.target.value)}
                    className="mr-3 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Serial</span>
                    <p className="text-xs text-gray-500">Episodes should be consumed in order</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="episodic"
                    checked={formData.podcastType === 'episodic'}
                    onChange={(e) => handleInputChange('podcastType', e.target.value)}
                    className="mr-3 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Episodic</span>
                    <p className="text-xs text-gray-500">Episodes can be consumed in any order</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Rating (Explicit Content) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Rating *
              </label>
              <select
                value={formData.explicit}
                onChange={(e) => handleInputChange('explicit', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {EXPLICIT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Podcast Category/iTunes Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Categories *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Primary Category
                  </label>
                  <select
                    value={formData.itunesCategories[0] || ''}
                    onChange={(e) => {
                      const newCategories = [...formData.itunesCategories];
                      if (e.target.value) {
                        newCategories[0] = e.target.value;
                      } else {
                        newCategories.splice(0, 1);
                      }
                      handleInputChange('itunesCategories', newCategories);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.itunesCategories ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select primary category</option>
                    {ITUNES_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Secondary Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Secondary Category (Optional)
                  </label>
                  <select
                    value={formData.itunesCategories[1] || ''}
                    onChange={(e) => {
                      const newCategories = [...formData.itunesCategories];
                      if (e.target.value) {
                        if (newCategories.length < 2) {
                          newCategories.push(e.target.value);
                        } else {
                          newCategories[1] = e.target.value;
                        }
                      } else {
                        newCategories.splice(1, 1);
                      }
                      handleInputChange('itunesCategories', newCategories);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    {ITUNES_CATEGORIES.filter(cat => cat !== formData.itunesCategories[0]).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.itunesCategories && <p className="text-red-500 text-xs mt-1">{errors.itunesCategories}</p>}
            </div>

            {/* Podcast Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podcast Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* Distribution Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Distribution Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="audio"
                    checked={formData.distributionType === 'audio'}
                    onChange={(e) => handleInputChange('distributionType', e.target.value)}
                    className="mr-3 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Audio Only</span>
                    <p className="text-xs text-gray-500">Convert videos to audio format for podcast platforms</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="video"
                    checked={formData.distributionType === 'video'}
                    onChange={(e) => handleInputChange('distributionType', e.target.value)}
                    className="mr-3 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Video</span>
                    <p className="text-xs text-gray-500">Keep video format for video podcast platforms</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 4: Owner Information */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
              <p className="text-sm text-gray-600">Legal and contact information for your podcast</p>
            </div>
            
            {/* Website Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Link
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.link ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://yourwebsite.com"
              />
              {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.author ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Podcast author name"
                />
                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Legal owner name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Email *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.ownerEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="owner@example.com"
              />
              {errors.ownerEmail && <p className="text-red-500 text-xs mt-1">{errors.ownerEmail}</p>}
              <p className="text-gray-500 text-xs mt-1">Required by Megaphone for podcast distribution and legal contact</p>
            </div>

            {/* Copyright Notice */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copyright Notice
              </label>
              <input
                type="text"
                value={formData.copyright}
                onChange={(e) => handleInputChange('copyright', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="© 2024 Your Name"
              />
            </div>
          </div>

          {/* SECTION 5: Additional Settings */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
              <p className="text-sm text-gray-600">Optional fields to enhance your podcast</p>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="technology, youtube, podcast, business"
              />
              <p className="text-gray-500 text-xs mt-1">
                Comma-separated keywords to help people discover your podcast
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Funding URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding URL
                </label>
                <input
                  type="url"
                  value={formData.fundingUrl}
                  onChange={(e) => handleInputChange('fundingUrl', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.fundingUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://patreon.com/yourpodcast"
                />
                {errors.fundingUrl && <p className="text-red-500 text-xs mt-1">{errors.fundingUrl}</p>}
                <p className="text-gray-500 text-xs mt-1">Link for listener donations/support</p>
              </div>

              {/* Trailer URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trailer URL
                </label>
                <input
                  type="url"
                  value={formData.trailerUrl}
                  onChange={(e) => handleInputChange('trailerUrl', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.trailerUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/trailer.mp3"
                />
                {errors.trailerUrl && <p className="text-red-500 text-xs mt-1">{errors.trailerUrl}</p>}
                <p className="text-gray-500 text-xs mt-1">Link to your podcast trailer</p>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex space-x-4 pt-8 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Podcast...
                </>
              ) : (
                'Create Podcast'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}