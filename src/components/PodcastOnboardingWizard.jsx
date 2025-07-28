import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadImage } from '../services/supabase';

// iTunes Categories from Apple's official list
const ITUNES_CATEGORIES = [
  'Arts', 'Business', 'Comedy', 'Education', 'Fiction', 'Government', 'Health & Fitness',
  'History', 'Kids & Family', 'Leisure', 'Music', 'News', 'Religion & Spirituality',
  'Science', 'Society & Culture', 'Sports', 'Technology', 'True Crime', 'TV & Film'
];

// Megaphone explicit content options
const EXPLICIT_OPTIONS = [
  { value: 'no', label: 'Unspecified' },
  { value: 'clean', label: 'Clean' },
  { value: 'yes', label: 'Explicit' }
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

const PODCAST_TYPES = [
  { value: 'serial', label: 'Serial', description: 'Episodes should be consumed in order' },
  { value: 'episodic', label: 'Episodic', description: 'Episodes can be consumed in any order' }
];

const DISTRIBUTION_TYPES = [
  { 
    value: 'audio', 
    label: 'Audio Podcast', 
    description: 'Convert YouTube videos to audio-only episodes',
    icon: '🎧'
  },
  { 
    value: 'video', 
    label: 'Video Podcast', 
    description: 'Keep original YouTube videos as video episodes',
    icon: '📹'
  }
];

const AD_VOLUME_OPTIONS = [
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: '1-2 ads per hour - Premium listener experience',
    revenue: '$5-8 CPM',
    frequency: '1-2 ads/hour',
    earnings: '$2-4/hour',
    badge: 'Premium',
    color: 'purple'
  },
  { 
    value: 'light', 
    label: 'Light', 
    description: '3-4 ads per hour - Balanced experience',
    revenue: '$8-12 CPM',
    frequency: '3-4 ads/hour',
    earnings: '$6-12/hour',
    badge: 'Balanced',
    color: 'blue'
  },
  { 
    value: 'standard', 
    label: 'Standard', 
    description: '6-8 ads per hour - Industry standard',
    revenue: '$15-22 CPM',
    frequency: '6-8 ads/hour',
    earnings: '$18-35/hour',
    badge: 'Recommended',
    color: 'green'
  },
  { 
    value: 'high', 
    label: 'High Revenue', 
    description: '10-12 ads per hour - Maximum monetization',
    revenue: '$25-35 CPM',
    frequency: '10-12 ads/hour',
    earnings: '$50-85/hour',
    badge: 'Max Revenue',
    color: 'yellow'
  }
];

const AD_PLACEMENT_OPTIONS = [
  { 
    value: 'preroll_only', 
    label: 'Pre-roll Only', 
    description: 'All ads at the beginning of episodes',
    icon: '▶️'
  },
  { 
    value: 'midroll_only', 
    label: 'Mid-roll Only', 
    description: 'All ads distributed throughout episodes',
    icon: '⏸️'
  },
  { 
    value: 'preroll_midroll', 
    label: 'Pre-roll + Mid-roll', 
    description: 'Mix of beginning and mid-episode ads',
    icon: '▶️⏸️'
  }
];

// Simplified to bank transfers only
const PAYOUT_METHOD = {
  value: 'bank_account',
  label: 'Bank Transfer',
  description: 'Secure transfers via local clearing or SWIFT network',
  icon: '🏦',
  type: 'BANK_ACCOUNT'
};

const ENTITY_TYPES = [
  { value: 'PERSONAL', label: 'Individual', description: 'Personal account holder' },
  { value: 'COMPANY', label: 'Business', description: 'Company or organization' }
];

// Auto-select optimal transfer method based on country
const getOptimalTransferMethod = (bankCountryCode) => {
  const country = AIRWALLEX_COUNTRIES.find(c => c.code === bankCountryCode);
  if (!country) return { method: 'SWIFT', info: { fees: '0.8-1.5%', time: '2-5 business days' } };
  
  if (country.local) {
    return {
      method: 'LOCAL',
      info: {
        fees: '0.2-0.8%',
        time: '1-2 business days',
        description: 'Local clearing system - faster and more cost-effective'
      }
    };
  } else {
    return {
      method: 'SWIFT',
      info: {
        fees: '0.8-1.5%',
        time: '2-5 business days',
        description: 'SWIFT international wire transfer'
      }
    };
  }
};

// Airwallex Supported Countries for Payouts (Local + SWIFT Coverage)
const AIRWALLEX_COUNTRIES = [
  // Major Markets with Local Clearing
  { code: 'US', name: 'United States', region: 'Americas', currencies: ['USD'], local: true },
  { code: 'CA', name: 'Canada', region: 'Americas', currencies: ['CAD'], local: true },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', currencies: ['GBP', 'EUR'], local: true },
  { code: 'AU', name: 'Australia', region: 'APAC', currencies: ['AUD'], local: true },
  { code: 'SG', name: 'Singapore', region: 'APAC', currencies: ['SGD'], local: true },
  { code: 'HK', name: 'Hong Kong SAR', region: 'APAC', currencies: ['HKD', 'CNY', 'USD'], local: true },
  { code: 'JP', name: 'Japan', region: 'APAC', currencies: ['JPY'], local: true },
  { code: 'DE', name: 'Germany', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'FR', name: 'France', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'NL', name: 'Netherlands', region: 'Europe', currencies: ['EUR'], local: true },
  
  // APAC Region
  { code: 'CN', name: 'China', region: 'APAC', currencies: ['CNY'], local: true },
  { code: 'IN', name: 'India', region: 'APAC', currencies: ['INR'], local: true },
  { code: 'ID', name: 'Indonesia', region: 'APAC', currencies: ['IDR'], local: true },
  { code: 'KR', name: 'South Korea', region: 'APAC', currencies: ['KRW'], local: true },
  { code: 'MY', name: 'Malaysia', region: 'APAC', currencies: ['MYR'], local: true },
  { code: 'NZ', name: 'New Zealand', region: 'APAC', currencies: ['NZD'], local: true },
  { code: 'PH', name: 'Philippines', region: 'APAC', currencies: ['PHP'], local: true },
  { code: 'TH', name: 'Thailand', region: 'APAC', currencies: ['THB'], local: true },
  { code: 'VN', name: 'Vietnam', region: 'APAC', currencies: ['VND'], local: true },
  { code: 'BD', name: 'Bangladesh', region: 'APAC', currencies: ['BDT'], local: true },
  { code: 'NP', name: 'Nepal', region: 'APAC', currencies: ['NPR'], local: true },
  { code: 'PK', name: 'Pakistan', region: 'APAC', currencies: ['PKR'], local: true },
  { code: 'LK', name: 'Sri Lanka', region: 'APAC', currencies: ['LKR'], local: true },
  { code: 'TR', name: 'Turkey', region: 'APAC', currencies: ['TRY'], local: true },
  
  // Europe
  { code: 'AT', name: 'Austria', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'BE', name: 'Belgium', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'BG', name: 'Bulgaria', region: 'Europe', currencies: ['BGN', 'EUR'], local: true },
  { code: 'HR', name: 'Croatia', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'CY', name: 'Cyprus', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', currencies: ['CZK', 'EUR'], local: true },
  { code: 'DK', name: 'Denmark', region: 'Europe', currencies: ['DKK', 'EUR'], local: true },
  { code: 'EE', name: 'Estonia', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'FI', name: 'Finland', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'GR', name: 'Greece', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'HU', name: 'Hungary', region: 'Europe', currencies: ['HUF', 'EUR'], local: true },
  { code: 'IE', name: 'Ireland', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'IT', name: 'Italy', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'LV', name: 'Latvia', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'LT', name: 'Lithuania', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'LU', name: 'Luxembourg', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'MT', name: 'Malta', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'NO', name: 'Norway', region: 'Europe', currencies: ['NOK', 'EUR'], local: true },
  { code: 'PL', name: 'Poland', region: 'Europe', currencies: ['PLN', 'EUR'], local: true },
  { code: 'PT', name: 'Portugal', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'RO', name: 'Romania', region: 'Europe', currencies: ['RON', 'EUR'], local: true },
  { code: 'SK', name: 'Slovakia', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'SI', name: 'Slovenia', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'ES', name: 'Spain', region: 'Europe', currencies: ['EUR'], local: true },
  { code: 'SE', name: 'Sweden', region: 'Europe', currencies: ['SEK', 'EUR'], local: true },
  { code: 'CH', name: 'Switzerland', region: 'Europe', currencies: ['CHF', 'EUR'], local: true },
  
  // Americas
  { code: 'AR', name: 'Argentina', region: 'Americas', currencies: ['ARS'], local: true },
  { code: 'BO', name: 'Bolivia', region: 'Americas', currencies: ['BOB'], local: true },
  { code: 'BR', name: 'Brazil', region: 'Americas', currencies: ['BRL'], local: true },
  { code: 'CL', name: 'Chile', region: 'Americas', currencies: ['CLP'], local: true },
  { code: 'CO', name: 'Colombia', region: 'Americas', currencies: ['COP'], local: true },
  { code: 'MX', name: 'Mexico', region: 'Americas', currencies: ['MXN'], local: true },
  { code: 'PE', name: 'Peru', region: 'Americas', currencies: ['PEN'], local: true },
  { code: 'PY', name: 'Paraguay', region: 'Americas', currencies: ['PYG'], local: true },
  { code: 'UY', name: 'Uruguay', region: 'Americas', currencies: ['UYU'], local: true },
  
  // Middle East
  { code: 'BH', name: 'Bahrain', region: 'Middle East', currencies: ['BHD'], local: true },
  { code: 'IL', name: 'Israel', region: 'Middle East', currencies: ['ILS'], local: true },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', currencies: ['AED'], local: true },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', currencies: ['SAR'], local: false },
  
  // Africa (Major Markets)
  { code: 'ZA', name: 'South Africa', region: 'Africa', currencies: ['ZAR'], local: false },
  { code: 'EG', name: 'Egypt', region: 'Africa', currencies: ['EGP'], local: false },
  { code: 'NG', name: 'Nigeria', region: 'Africa', currencies: ['NGN'], local: false },
  { code: 'KE', name: 'Kenya', region: 'Africa', currencies: ['KES'], local: false },
  { code: 'GH', name: 'Ghana', region: 'Africa', currencies: ['GHS'], local: false }
].sort((a, b) => a.name.localeCompare(b.name));

// Currency options based on Airwallex support
const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function PodcastOnboardingWizard({ channelData, prefillData, onSubmit, onCancel, loading }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    title: prefillData?.title || '',
    subtitle: prefillData?.subtitle || '',
    summary: prefillData?.description || prefillData?.summary || '',
    
    // Content Details
    podcastType: prefillData?.podcastType || 'serial',
    distributionType: prefillData?.distributionType || 'audio',
    explicit: prefillData?.explicit || 'clean',
    itunesCategories: prefillData?.itunesCategories || [prefillData?.primaryCategory || 'Technology'],
    language: prefillData?.language || 'en',
    
    // Artwork
    imageFile: prefillData?.imageFile || prefillData?.artworkUrl || '',
    customArtwork: null,
    useChannelArtwork: true,
    
    // Owner Information  
    author: prefillData?.author || '',
    ownerName: prefillData?.ownerName || '',
    ownerEmail: prefillData?.ownerEmail || JSON.parse(localStorage.getItem('user_info') || '{}').email || '',
    link: prefillData?.link || prefillData?.websiteUrl || '',
    copyright: prefillData?.copyright || '',
    
    // Additional Settings
    keywords: prefillData?.keywords || '',
    fundingUrl: prefillData?.fundingUrl || '',
    trailerUrl: prefillData?.trailerUrl || '',
    
    // Monetization Settings
    adVolume: prefillData?.adVolume || 'standard',
    adPlacement: prefillData?.adPlacement || 'preroll_midroll',
    payoutMethod: 'bank_account', // Always bank transfer
    payoutEmail: prefillData?.payoutEmail || JSON.parse(localStorage.getItem('user_info') || '{}').email || '',
    
    // Beneficiary Information for Airwallex - Updated for API compliance
    beneficiaryEntityType: prefillData?.beneficiaryEntityType || 'PERSONAL',
    transferMethod: '', // Auto-selected based on bank country
    beneficiaryName: prefillData?.beneficiaryName || '', // For COMPANY type
    beneficiaryFirstName: prefillData?.beneficiaryFirstName || '', // For PERSONAL type
    beneficiaryLastName: prefillData?.beneficiaryLastName || '', // For PERSONAL type
    companyRegistrationNumber: prefillData?.companyRegistrationNumber || '', // Optional for COMPANY type
    bankCountry: prefillData?.bankCountry || 'US',
    accountCurrency: prefillData?.accountCurrency || 'USD',
    bankName: prefillData?.bankName || '',
    accountNumber: prefillData?.accountNumber || '',
    routingNumber: prefillData?.routingNumber || '', // ABA routing for US, sort code for UK
    swiftCode: prefillData?.swiftCode || '', // For international transfers
    
    // Address Information
    addressLine1: prefillData?.addressLine1 || '',
    addressLine2: prefillData?.addressLine2 || '',
    city: prefillData?.city || '',
    state: prefillData?.state || '',
    postalCode: prefillData?.postalCode || '',
    country: prefillData?.country || 'US',
    ...prefillData
  });

  const [errors, setErrors] = useState({});
  const fileInputRef = React.useRef(null);

  const steps = [
    { id: 1, title: 'Basics', description: 'Start with the basics' },
    { id: 2, title: 'Show Art', description: 'Choose your show art (required)' },
    { id: 3, title: 'Details', description: 'Content details' },
    { id: 4, title: 'Owner Info', description: 'Legal information' },
    { id: 5, title: 'Monetization', description: 'Ad preferences' },
    { id: 6, title: 'Payouts', description: 'Banking & payouts' },
    { id: 7, title: 'Review', description: 'Review & create' }
  ];

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    switch (stepNumber) {
      case 1: // Basics
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
        break;
        
      case 2: // Show Art
        if (!formData.useChannelArtwork && !formData.customArtwork) {
          newErrors.artwork = 'Please select channel artwork or upload custom artwork';
        }
        break;
        
      case 3: // Details
        if (!formData.itunesCategories || formData.itunesCategories.length === 0) {
          newErrors.itunesCategories = 'At least one iTunes category is required';
        }
        
        if (!formData.language?.trim()) {
          newErrors.language = 'Language is required';
        }
        break;
        
      case 4: // Owner Info
        if (!formData.author?.trim()) {
          newErrors.author = 'Author name is required';
        }
        
        if (!formData.ownerEmail?.trim()) {
          newErrors.ownerEmail = 'Owner email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
          newErrors.ownerEmail = 'Please enter a valid email address';
        }

        if (formData.link && !/^https?:\/\/.+/.test(formData.link)) {
          newErrors.link = 'Website URL must start with http:// or https://';
        }
        break;
        
      case 5: // Monetization Settings
        // Ad volume validation
        if (!formData.adVolume) {
          newErrors.adVolume = 'Please select an ad volume preference';
        }
        if (!formData.adPlacement) {
          newErrors.adPlacement = 'Please select an ad placement strategy';
        }
        break;
        
      case 6: // Payout Settings
        // Enhanced email validation per Airwallex requirements
        if (!formData.payoutEmail?.trim()) {
          newErrors.payoutEmail = 'Notification email is required for payouts';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.payoutEmail)) {
          newErrors.payoutEmail = 'Please enter a valid email address';
        } else if (formData.payoutEmail.length > 100) {
          newErrors.payoutEmail = 'Email address must be under 100 characters';
        }
        
        // Airwallex beneficiary validation - Updated for API compliance
        if (!formData.beneficiaryEntityType) {
          newErrors.beneficiaryEntityType = 'Please specify if this is personal or business account';
        }
        
        // Validation based on entity type
        if (formData.beneficiaryEntityType === 'PERSONAL') {
          if (!formData.beneficiaryFirstName?.trim()) {
            newErrors.beneficiaryFirstName = 'First name is required for personal accounts';
          } else if (formData.beneficiaryFirstName.length < 2) {
            newErrors.beneficiaryFirstName = 'First name must be at least 2 characters';
          } else if (formData.beneficiaryFirstName.length > 50) {
            newErrors.beneficiaryFirstName = 'First name must be under 50 characters';
          }
          
          if (!formData.beneficiaryLastName?.trim()) {
            newErrors.beneficiaryLastName = 'Last name is required for personal accounts';
          } else if (formData.beneficiaryLastName.length < 2) {
            newErrors.beneficiaryLastName = 'Last name must be at least 2 characters';
          } else if (formData.beneficiaryLastName.length > 50) {
            newErrors.beneficiaryLastName = 'Last name must be under 50 characters';
          }
        } else if (formData.beneficiaryEntityType === 'COMPANY') {
          if (!formData.beneficiaryName?.trim()) {
            newErrors.beneficiaryName = 'Company name is required for business accounts';
          } else if (formData.beneficiaryName.length < 2) {
            newErrors.beneficiaryName = 'Company name must be at least 2 characters';
          } else if (formData.beneficiaryName.length > 100) {
            newErrors.beneficiaryName = 'Company name must be under 100 characters';
          }
        }
        
        // Bank account validation (always required since we only support bank transfers)
        {
          // Transfer method is auto-selected, no validation needed
          if (!formData.bankCountry?.trim()) {
            newErrors.bankCountry = 'Bank country is required for compliance';
          }
          if (!formData.accountCurrency?.trim()) {
            newErrors.accountCurrency = 'Account currency is required';
          }
          if (!formData.bankName?.trim()) {
            newErrors.bankName = 'Bank name is required for wire transfers';
          } else if (formData.bankName.length > 100) {
            newErrors.bankName = 'Bank name must be under 100 characters';
          }
          if (!formData.accountNumber?.trim()) {
            newErrors.accountNumber = 'Account number is required';
          } else if (formData.accountNumber.length < 4) {
            newErrors.accountNumber = 'Account number appears too short';
          } else if (formData.accountNumber.length > 34) {
            newErrors.accountNumber = 'Account number must be under 34 characters';
          }
          
          // Routing number validation - Required for both LOCAL and SWIFT transfers
          if (!formData.routingNumber?.trim()) {
            newErrors.routingNumber = 'Routing number is required for bank transfers';
          } else if (formData.bankCountry === 'US' && formData.routingNumber.length !== 9) {
            newErrors.routingNumber = 'US ABA routing number must be exactly 9 digits';
          } else if (formData.bankCountry === 'GB' && formData.routingNumber.length !== 6) {
            newErrors.routingNumber = 'UK sort code must be exactly 6 digits';
          }
        }
        
        // Enhanced address validation per Airwallex compliance requirements
        if (!formData.addressLine1?.trim()) {
          newErrors.addressLine1 = 'Street address is required for KYC compliance';
        } else if (formData.addressLine1.toLowerCase().includes('p.o. box') || formData.addressLine1.toLowerCase().includes('po box')) {
          newErrors.addressLine1 = 'P.O. Box addresses are not accepted - physical address required';
        } else if (formData.addressLine1.length > 100) {
          newErrors.addressLine1 = 'Address line 1 must be under 100 characters';
        }
        
        if (formData.addressLine2 && formData.addressLine2.length > 100) {
          newErrors.addressLine2 = 'Address line 2 must be under 100 characters';
        }
        
        if (!formData.city?.trim()) {
          newErrors.city = 'City is required for address verification';
        } else if (formData.city.length > 50) {
          newErrors.city = 'City name must be under 50 characters';
        }
        
        if (!formData.country?.trim()) {
          newErrors.country = 'Country is required for regulatory compliance';
        }
        
        if (!formData.postalCode?.trim()) {
          newErrors.postalCode = 'Postal/ZIP code is required';
        } else if (formData.postalCode.length > 20) {
          newErrors.postalCode = 'Postal code must be under 20 characters';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const handleInputChange = (field, value) => {
    let updates = { [field]: value };
    
    // Auto-select optimal transfer method when bank country changes
    if (field === 'bankCountry' && value) {
      const optimal = getOptimalTransferMethod(value);
      updates.transferMethod = optimal.method;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArtworkUpload = async (e) => {
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

    // Show upload progress
    toast.info('Uploading image...');

    try {
      // Upload to Supabase Storage
      const uploadResult = await uploadImage(file, 'podcast-images', 'artwork');
      
      if (!uploadResult.success) {
        throw new Error('Upload failed');
      }

      // Create preview and get dimensions for validation
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
            toast.success('Perfect! 3000x3000 square artwork uploaded to Supabase');
          } else {
            toast.success('Image uploaded to Supabase successfully');
          }

          // Create file object with metadata including Supabase URL
          const fileWithPreview = {
            file: file,
            preview: event.target.result,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
            dimensions: `${width}×${height}`,
            width: width,
            height: height,
            supabaseUrl: uploadResult.publicUrl,
            supabaseFileName: uploadResult.fileName
          };

          handleInputChange('customArtwork', fileWithPreview);
          handleInputChange('useChannelArtwork', false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      toast.error(`Image upload failed: ${error.message}`);
    }
  };

  const handleSubmit = () => {
    // Final validation
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5) || !validateStep(6)) {
      toast.error('Please complete all required fields');
      return;
    }

    // Add channel and user data to form submission
    const submissionData = {
      ...formData,
      channelId: channelData?.id,
      userId: JSON.parse(localStorage.getItem('user_info') || '{}').id,
      
      // Ensure required fields for n8n workflow
      primaryCategory: formData.itunesCategories[0],
      secondaryCategory: formData.itunesCategories[1] || '',
      description: formData.summary, // Map summary to description for backward compatibility
      
      // Artwork data - Use Supabase URL for both fields (Megaphone uses imageFile)
      finalArtworkUrl: formData.useChannelArtwork ? formData.imageFile : 
                      (formData.customArtwork?.supabaseUrl || null),
      backgroundImageFileUrl: formData.useChannelArtwork ? formData.imageFile : 
                             (formData.customArtwork?.supabaseUrl || null),
      imageFile: formData.useChannelArtwork ? formData.imageFile : 
                (formData.customArtwork?.supabaseUrl || null),
      customArtworkData: !formData.useChannelArtwork && formData.customArtwork ? {
        name: formData.customArtwork.name,
        size: formData.customArtwork.size,
        dimensions: formData.customArtwork.dimensions,
        dataUrl: formData.customArtwork.preview,
        supabaseUrl: formData.customArtwork.supabaseUrl,
        supabaseFileName: formData.customArtwork.supabaseFileName
      } : null
    };

    console.log('🖼️ Image URLs being sent:', {
      useChannelArtwork: formData.useChannelArtwork,
      channelImageFile: formData.imageFile,
      customArtworkUrl: formData.customArtwork?.supabaseUrl,
      finalImageFile: submissionData.imageFile,
      allImageFields: {
        imageFile: submissionData.imageFile,
        backgroundImageFileUrl: submissionData.backgroundImageFileUrl,
        finalArtworkUrl: submissionData.finalArtworkUrl
      }
    });
    
    onSubmit(submissionData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicsStep();
      case 2:
        return renderArtworkStep();
      case 3:
        return renderDetailsStep();
      case 4:
        return renderOwnerInfoStep();
      case 5:
        return renderMonetizationStep();
      case 6:
        return renderPayoutStep();
      case 7:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's start with the basics
        </h2>
        <p className="text-gray-600">You can always change these details later.</p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Show Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Show name
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Add a great name here"
            maxLength="255"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
            <p className="text-gray-400 text-xs ml-auto">{formData.title.length}/100</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            rows="4"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.summary ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell fans what your show is about and why they'll love it"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.summary && <p className="text-red-500 text-xs">{errors.summary}</p>}
            <p className="text-gray-400 text-xs ml-auto">{formData.summary.length}/600</p>
          </div>
        </div>

        {/* Creator Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Creator name
          </label>
          <p className="text-sm text-gray-500 mb-2">
            The host, creator, or organization name as it should appear alongside the show name.
          </p>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.author ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="GRINDLIKENEVABEFO"
            maxLength="80"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.author && <p className="text-red-500 text-xs">{errors.author}</p>}
            <p className="text-gray-400 text-xs ml-auto">{formData.author.length}/80</p>
          </div>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subtitle
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
        </div>
      </div>
    </div>
  );

  const renderArtworkStep = () => {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose your show art
          </h2>
          <p className="text-gray-600">Upload square artwork - <span className="text-red-600 font-medium">Required</span> • 3000 x 3000 pixels minimum</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-12 max-w-md">
            {/* Channel Artwork Option */}
            {formData.imageFile && (
              <div className={`border-2 rounded-xl p-8 cursor-pointer transition-all ${
                formData.useChannelArtwork ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('useChannelArtwork', true)}>
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-6 border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                    <img 
                      src={formData.imageFile} 
                      alt="Channel artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Use channel artwork</h3>
                  <p className="text-sm text-gray-500 mb-2">From your YouTube channel</p>
                  <p className="text-xs text-amber-600">⚠️ May need resizing to 3000x3000</p>
                </div>
              </div>
            )}

            {/* Custom Artwork Option */}
            <div className={`border-2 rounded-xl p-8 cursor-pointer transition-all ${
              !formData.useChannelArtwork ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              handleInputChange('useChannelArtwork', false);
              if (!formData.customArtwork) {
                fileInputRef.current?.click();
              }
            }}>
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:border-indigo-400 hover:bg-indigo-25">
                  {formData.customArtwork ? (
                    <img 
                      src={formData.customArtwork.preview} 
                      alt="Custom artwork preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-600">Drag and drop or</p>
                        <p className="text-base text-indigo-600 font-medium">Select a file</p>
                        <p className="text-sm text-gray-500">3000×3000 pixels</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkUpload}
                  className="hidden"
                />
                
                {formData.customArtwork && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">{formData.customArtwork.name}</p>
                    <p className="text-xs text-green-700">{formData.customArtwork.size} • {formData.customArtwork.dimensions}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Change image
                    </button>
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload custom artwork</h3>
                <p className="text-sm text-gray-500">
                  {formData.customArtwork ? 'Click to change image' : 'Click anywhere to upload'}
                </p>
              </div>
            </div>
          </div>
          </div>

          {/* Requirements */}
          <div className="mt-12 bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium text-red-800">Required Specifications</h3>
                <div className="mt-3 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Minimum size:</strong> 3000 x 3000 pixels</li>
                    <li><strong>Format:</strong> JPG or PNG</li>
                    <li><strong>Shape:</strong> Perfect square (same width and height)</li>
                    <li><strong>Color:</strong> RGB colorspace</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {errors.artwork && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{errors.artwork}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Content details
        </h2>
        <p className="text-gray-600">Define your podcast type, rating, and categories</p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Distribution Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Distribution Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DISTRIBUTION_TYPES.map(type => (
              <label key={type.value} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                formData.distributionType === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  value={type.value}
                  checked={formData.distributionType === type.value}
                  onChange={(e) => handleInputChange('distributionType', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <select
            value={formData.itunesCategories[0] || ''}
            onChange={(e) => {
              const newCategories = e.target.value ? [e.target.value] : [];
              handleInputChange('itunesCategories', newCategories);
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white ${
              errors.itunesCategories ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Choose one option...</option>
            {ITUNES_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.itunesCategories && <p className="text-red-500 text-xs mt-1">{errors.itunesCategories}</p>}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Language
          </label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Podcast Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Podcast Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PODCAST_TYPES.map(type => (
              <label key={type.value} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                formData.podcastType === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  value={type.value}
                  checked={formData.podcastType === type.value}
                  onChange={(e) => handleInputChange('podcastType', e.target.value)}
                  className="mr-3 text-indigo-600 mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{type.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Explicit Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Content Rating
          </label>
          <div className="grid grid-cols-3 gap-4">
            {EXPLICIT_OPTIONS.map(option => (
              <label key={option.value} className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                formData.explicit === option.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.explicit === option.value}
                  onChange={(e) => handleInputChange('explicit', e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOwnerInfoStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Owner information
        </h2>
        <p className="text-gray-600">Legal and contact information for your podcast</p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Owner Email */}
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
          <p className="text-gray-500 text-xs mt-1">Required by Megaphone for podcast distribution</p>
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

        {/* Copyright */}
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
    </div>
  );

  const renderMonetizationStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Monetization Settings
        </h2>
        <p className="text-gray-600">Configure your ad preferences for maximum revenue</p>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Ad Volume Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ad Volume
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Choose how many ads per hour of content. Industry standard is 6-8 ads per hour.
          </p>
          <div className="space-y-3">
            {AD_VOLUME_OPTIONS.map(option => (
              <label key={option.value} className={`relative flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                formData.adVolume === option.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  option.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                  option.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  option.color === 'green' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {option.badge}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    value={option.value}
                    checked={formData.adVolume === option.value}
                    onChange={(e) => handleInputChange('adVolume', e.target.value)}
                    className="text-indigo-600 mr-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-700">{option.frequency}</div>
                  <div className="text-sm font-semibold text-green-700">{option.earnings}</div>
                  <p className="text-xs text-gray-500">{option.revenue} CPM</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Ad Placement Strategy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ad Placement Strategy
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Choose when ads appear in your episodes. This affects listener experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AD_PLACEMENT_OPTIONS.map(option => (
              <label key={option.value} className={`flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${
                formData.adPlacement === option.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  value={option.value}
                  checked={formData.adPlacement === option.value}
                  onChange={(e) => handleInputChange('adPlacement', e.target.value)}
                  className="sr-only"
                />
                <span className="text-2xl mb-2">{option.icon}</span>
                <span className="text-sm font-medium text-gray-900 mb-1">{option.label}</span>
                <p className="text-xs text-gray-500 text-center">{option.description}</p>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayoutStep = () => {
    const getTransferMethodInfo = (bankCountryCode) => {
      if (!bankCountryCode) return null;
      return getOptimalTransferMethod(bankCountryCode);
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payout Settings
          </h2>
          <p className="text-gray-600">Set up secure global payouts via Airwallex</p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">

          {/* Payout Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payout Method
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{PAYOUT_METHOD.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">{PAYOUT_METHOD.label}</p>
                    <p className="text-xs text-blue-700">{PAYOUT_METHOD.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-900">Powered by Airwallex</p>
                  <p className="text-xs text-blue-600">200+ countries supported</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Schedule & Thresholds */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Payout Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Minimum Payout:</span>
                <p className="text-gray-600">$25 USD equivalent</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payout Schedule:</span>
                <p className="text-gray-600">Monthly (1st of month)</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Processing Time:</span>
                <p className="text-gray-600">1-5 business days</p>
              </div>
            </div>
          </div>

          {/* Beneficiary Information */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Beneficiary Information</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Secure & Compliant</p>
                  <p className="text-xs text-blue-700">All information is encrypted and stored securely per banking regulations. Required by Airwallex for KYC compliance.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ENTITY_TYPES.map(type => (
                    <label key={type.value} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.beneficiaryEntityType === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        value={type.value}
                        checked={formData.beneficiaryEntityType === type.value}
                        onChange={(e) => handleInputChange('beneficiaryEntityType', e.target.value)}
                        className="text-indigo-600 mr-3"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Beneficiary Name - Updated for Airwallex API compliance */}
              {formData.beneficiaryEntityType === 'PERSONAL' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.beneficiaryFirstName}
                      onChange={(e) => handleInputChange('beneficiaryFirstName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.beneficiaryFirstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.beneficiaryFirstName && <p className="text-red-500 text-xs mt-1">{errors.beneficiaryFirstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.beneficiaryLastName}
                      onChange={(e) => handleInputChange('beneficiaryLastName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.beneficiaryLastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.beneficiaryLastName && <p className="text-red-500 text-xs mt-1">{errors.beneficiaryLastName}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.beneficiaryName}
                      onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.beneficiaryName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Your Company Ltd."
                    />
                    {errors.beneficiaryName && <p className="text-red-500 text-xs mt-1">{errors.beneficiaryName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.companyRegistrationNumber}
                      onChange={(e) => handleInputChange('companyRegistrationNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="12345678"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Optional but recommended for faster verification
                    </p>
                  </div>
                </div>
              )}

              {/* Payout Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Email *
                </label>
                <input
                  type="email"
                  value={formData.payoutEmail}
                  onChange={(e) => handleInputChange('payoutEmail', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.payoutEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="payouts@example.com"
                />
                {errors.payoutEmail && <p className="text-red-500 text-xs mt-1">{errors.payoutEmail}</p>}
                <p className="text-gray-500 text-xs mt-1">
                  You'll receive payout notifications at this email address
                </p>
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h4>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Country *
                  </label>
                  <select
                    value={formData.bankCountry}
                    onChange={(e) => handleInputChange('bankCountry', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white ${
                      errors.bankCountry ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select bank country...</option>
                    {AIRWALLEX_COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} {country.local ? '(Local Clearing Available)' : '(SWIFT Only)'}
                      </option>
                    ))}
                  </select>
                  {errors.bankCountry && <p className="text-red-500 text-xs mt-1">{errors.bankCountry}</p>}
                </div>

                {/* Account Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Currency *
                  </label>
                  <select
                    value={formData.accountCurrency}
                    onChange={(e) => handleInputChange('accountCurrency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  >
                    <option value="">Select currency...</option>
                    {SUPPORTED_CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.bankName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Chase Bank"
                  />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                  />
                  {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
              </div>

              {/* Banking Codes - Updated for Airwallex API compliance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number / Sort Code *
                  </label>
                  <input
                    type="text"
                    value={formData.routingNumber}
                    onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.routingNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={formData.bankCountry === 'US' ? '021000021' : formData.bankCountry === 'GB' ? '123456' : 'Routing number'}
                    maxLength={formData.bankCountry === 'US' ? '9' : formData.bankCountry === 'GB' ? '6' : '20'}
                  />
                  {errors.routingNumber && <p className="text-red-500 text-xs mt-1">{errors.routingNumber}</p>}
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.bankCountry === 'US' ? '⚠️ Must be exactly 9 digits (ABA routing number)' : 
                     formData.bankCountry === 'GB' ? '⚠️ Must be exactly 6 digits (sort code)' : 
                     'Local routing number if applicable'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SWIFT/BIC Code
                  </label>
                  <input
                    type="text"
                    value={formData.swiftCode}
                    onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="CHASUS33"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Required for international wire transfers
                  </p>
                </div>
              </div>
            </div>
            
            {/* Auto-selected Transfer Method Display */}
            {formData.bankCountry && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Transfer Method (Auto-selected)</h5>
                {(() => {
                  const transferInfo = getTransferMethodInfo(formData.bankCountry);
                  if (!transferInfo) return null;
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {transferInfo.method === 'LOCAL' ? 'Local Clearing' : 'SWIFT Network'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{transferInfo.info.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-700">{transferInfo.info.time}</div>
                        <div className="text-sm font-semibold text-green-700">{transferInfo.info.fees}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
            <p className="text-sm text-gray-500 mb-6">
              Required for compliance and verification purposes. P.O. Box addresses are not accepted.
            </p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.addressLine1 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123 Main Street"
                  />
                  {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Apt 4B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="New York"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.postalCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="10001"
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white ${
                    errors.country ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select country...</option>
                  {AIRWALLEX_COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Revenue Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Revenue Sharing</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You keep <strong>70%</strong> of all ad revenue generated from your podcast episodes.</p>
                  <p className="mt-1">Payouts are processed monthly via <strong>Airwallex</strong> for balances over $25.</p>
                  <p className="mt-1 text-xs">✅ Global payouts to 180+ countries with low fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Review your podcast
        </h2>
        <p className="text-gray-600">Everything look good? Let's create your podcast!</p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Channel Source Info - Top Banner */}
        {channelData && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center text-blue-800 text-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              <strong>Source:</strong> {channelData.title} ({channelData.videoCount} videos)
            </div>
          </div>
        )}

        {/* Main Podcast Card - Redesigned */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-start gap-8">
              {/* Large Artwork */}
              <div className="flex-shrink-0">
                <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                  {formData.useChannelArtwork ? (
                    <img src={formData.imageFile} alt="Channel artwork" className="w-full h-full object-cover" />
                  ) : formData.customArtwork ? (
                    <img src={formData.customArtwork.preview} alt="Custom artwork" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No artwork</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Podcast Details */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{formData.title}</h1>
                  {formData.subtitle && (
                    <p className="text-lg text-gray-600 leading-relaxed">{formData.subtitle}</p>
                  )}
                </div>
                
                {/* Tags Row */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {DISTRIBUTION_TYPES.find(d => d.value === formData.distributionType)?.icon}
                    {DISTRIBUTION_TYPES.find(d => d.value === formData.distributionType)?.label}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {formData.itunesCategories[0]}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {LANGUAGES.find(l => l.code === formData.language)?.name}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {EXPLICIT_OPTIONS.find(o => o.value === formData.explicit)?.label}
                  </span>
                </div>
                
                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                    {formData.summary}
                  </p>
                </div>
                
                {/* Creator Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span><strong>Creator:</strong> {formData.author}</span>
                    <span><strong>Type:</strong> {formData.podcastType === 'serial' ? 'Serial' : 'Episodic'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid - Redesigned */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{formData.title}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subtitle</dt>
                <dd className="text-sm text-gray-900 mt-1">{formData.subtitle}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</dt>
                <dd className="text-sm text-gray-900 mt-1">{formData.author}</dd>
              </div>
            </div>
          </div>

          {/* Content Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Content Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Distribution</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{DISTRIBUTION_TYPES.find(d => d.value === formData.distributionType)?.label}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</dt>
                <dd className="text-sm text-gray-900 mt-1">{formData.itunesCategories[0]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Language</dt>
                <dd className="text-sm text-gray-900 mt-1">{LANGUAGES.find(l => l.code === formData.language)?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</dt>
                <dd className="text-sm text-gray-900 mt-1">{formData.podcastType === 'serial' ? 'Serial' : 'Episodic'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</dt>
                <dd className="text-sm text-gray-900 mt-1">{EXPLICIT_OPTIONS.find(o => o.value === formData.explicit)?.label}</dd>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</dt>
                <dd className="text-sm text-gray-900 mt-1 break-all">{formData.ownerEmail}</dd>
              </div>
              {formData.link && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</dt>
                  <dd className="text-sm text-blue-600 mt-1 break-all hover:underline">
                    <a href={formData.link} target="_blank" rel="noopener noreferrer">{formData.link}</a>
                  </dd>
                </div>
              )}
              {formData.ownerName && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formData.ownerName}</dd>
                </div>
              )}
              {formData.copyright && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Copyright</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formData.copyright}</dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Artwork & Monetization - Full Width Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artwork Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Artwork</h3>
            </div>
            <div className="space-y-4">
              {formData.useChannelArtwork ? (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-medium">Using channel artwork</dd>
                </div>
              ) : formData.customArtwork ? (
                <>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">File</dt>
                    <dd className="text-sm text-gray-900 mt-1">{formData.customArtwork.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dimensions</dt>
                    <dd className="text-sm text-gray-900 mt-1 font-medium">{formData.customArtwork.dimensions}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</dt>
                    <dd className="text-sm text-gray-900 mt-1">{formData.customArtwork.size}</dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                  <dd className="text-sm text-amber-600 mt-1 font-medium">⚠️ No artwork selected</dd>
                </div>
              )}
            </div>
          </div>

          {/* Monetization Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Monetization Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ad Volume</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{AD_VOLUME_OPTIONS.find(a => a.value === formData.adVolume)?.label}</dd>
                <dd className="text-xs text-gray-500 mt-1">{AD_VOLUME_OPTIONS.find(a => a.value === formData.adVolume)?.frequency}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ad Placement</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">
                  {AD_PLACEMENT_OPTIONS.find(a => a.value === formData.adPlacement)?.icon} {AD_PLACEMENT_OPTIONS.find(a => a.value === formData.adPlacement)?.label}
                </dd>
                <dd className="text-xs text-gray-500 mt-1">{AD_PLACEMENT_OPTIONS.find(a => a.value === formData.adPlacement)?.description}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payout Method</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{PAYOUT_METHOD.label}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payout Email</dt>
                <dd className="text-sm text-gray-900 mt-1 break-all">{formData.payoutEmail}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-medium text-gray-600 mb-2">Add a new show</h1>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.title}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : currentStep === steps.length ? (
              'Create Podcast'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}