export interface Podcast {
  id: string;
  user_id: string;
  channel_id?: string;
  
  // Megaphone Details
  megaphone_id?: string;
  megaphone_uid?: string;
  feed_url?: string;
  network_id?: string;
  
  // Podcast Information
  title: string;
  subtitle?: string;
  summary?: string;
  author?: string;
  language?: string;
  explicit?: boolean;
  primary_category?: string;
  secondary_category?: string;
  podcast_type?: string;
  copyright?: string;
  owner_name?: string;
  owner_email?: string;
  link?: string;
  keywords?: string;
  
  // Image/Artwork
  image_url?: string;
  megaphone_image_url?: string;
  
  // Status & Metadata
  status: 'active' | 'inactive' | 'draft';
  episodes_count?: number;
  episode_limit?: number;
  itunes_active?: boolean;
  slug?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  megaphone_created_at?: string;
  megaphone_updated_at?: string;
}

export interface PayoutDetails {
  id: string;
  user_id: string;
  podcast_id: string;
  beneficiary_entity_type?: string;
  beneficiary_name?: string;
  beneficiary_first_name?: string;
  beneficiary_last_name?: string;
  payout_email?: string;
  bank_country?: string;
  account_currency?: string;
  bank_name?: string;
  account_number?: string;
  routing_number?: string;
  transfer_method?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  airwallex_beneficiary_id?: string;
  status: 'active' | 'pending' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}