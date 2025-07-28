import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to your .env file')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

class SupabaseService {
  constructor() {
    this.client = supabase
  }

  // Upload image to Supabase Storage
  async uploadImage(file, bucket = 'podcast-images', folder = 'artwork') {
    try {
      console.log('📤 Uploading image to Supabase Storage:', { 
        fileName: file.name, 
        size: file.size,
        type: file.type 
      })

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload file
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Supabase upload error:', error)
        throw new Error(`Image upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = this.client.storage
        .from(bucket)
        .getPublicUrl(fileName)

      console.log('✅ Image uploaded successfully:', { fileName, publicUrl })

      return {
        success: true,
        fileName: data.path,
        publicUrl,
        fullPath: data.fullPath
      }
    } catch (error) {
      console.error('❌ Image upload failed:', error)
      throw error
    }
  }

  // Save complete podcast details after Megaphone creation
  async savePodcastDetails(userId, formData, megaphoneResponse) {
    try {
      console.log('💾 Saving podcast details to Supabase:', { 
        userId, 
        title: formData.title,
        megaphoneId: megaphoneResponse.id || 'using-temporary-id'
      })

      const podcastData = megaphoneResponse
      
      const { data, error } = await this.client
        .from('podcasts')
        .insert([
          {
            user_id: userId,
            channel_id: formData.channelId,
            
            // Megaphone Details (handle case where n8n doesn't return ID yet)
            megaphone_id: podcastData.id || `temp_${Date.now()}`,
            megaphone_uid: podcastData.uid || `temp_uid_${Date.now()}`,
            feed_url: podcastData.feedUrl || null,
            network_id: podcastData.networkId || null,
            
            // Podcast Information
            title: podcastData.title || formData.title,
            subtitle: podcastData.subtitle || formData.subtitle,
            summary: podcastData.summary || formData.summary,
            author: podcastData.author || formData.author,
            language: podcastData.language || formData.language,
            explicit: (podcastData.explicit || formData.explicit) === 'yes' ? true : false,
            primary_category: formData.primaryCategory,
            secondary_category: formData.secondaryCategory,
            podcast_type: podcastData.podcastType,
            copyright: podcastData.copyright,
            owner_name: podcastData.ownerName,
            owner_email: podcastData.ownerEmail,
            link: podcastData.link,
            keywords: formData.keywords,
            distribution_type: formData.distributionType || 'audio', // Add distribution type
            
            // Image/Artwork (use the same URL for both fields)
            image_url: formData.imageFile || formData.backgroundImageFileUrl || podcastData.imageFile,
            megaphone_image_url: podcastData.imageFile || formData.imageFile,
            
            // Status & Metadata
            status: 'active',
            episodes_count: podcastData.episodesCount || 0,
            episode_limit: podcastData.episodeLimit || 5000,
            itunes_active: podcastData.itunesActive || false,
            slug: podcastData.slug,
            
            // Timestamps
            megaphone_created_at: podcastData.createdAt,
            megaphone_updated_at: podcastData.updatedAt
          }
        ])
        .select()

      if (error) {
        console.error('❌ Supabase podcast save error:', error)
        throw new Error(`Failed to save podcast details: ${error.message}`)
      }

      console.log('✅ Podcast details saved successfully:', data[0]?.id)
      return data[0]
    } catch (error) {
      console.error('❌ Failed to save podcast details:', error)
      throw error
    }
  }

  // Save payout details to database (podcastId is Supabase podcast UUID)
  async savePayoutDetails(userId, supabasePodcastId, payoutData) {
    try {
      console.log('💳 Saving payout details to Supabase:', { userId, supabasePodcastId })

      const { data, error } = await this.client
        .from('payout_details')
        .insert([
          {
            user_id: userId,
            podcast_id: supabasePodcastId,
            beneficiary_entity_type: payoutData.beneficiaryEntityType,
            beneficiary_name: payoutData.beneficiaryName,
            beneficiary_first_name: payoutData.beneficiaryFirstName,
            beneficiary_last_name: payoutData.beneficiaryLastName,
            payout_email: payoutData.payoutEmail,
            bank_country: payoutData.bankCountry,
            account_currency: payoutData.accountCurrency,
            bank_name: payoutData.bankName,
            account_number: payoutData.accountNumber,
            routing_number: payoutData.routingNumber,
            transfer_method: payoutData.transferMethod,
            address_line1: payoutData.addressLine1,
            address_line2: payoutData.addressLine2,
            city: payoutData.city,
            state: payoutData.state,
            postal_code: payoutData.postalCode,
            country: payoutData.country,
            airwallex_beneficiary_id: payoutData.airwallexBeneficiaryId,
            status: payoutData.airwallexBeneficiaryId ? 'active' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('❌ Supabase payout save error:', error)
        throw new Error(`Failed to save payout details: ${error.message}`)
      }

      console.log('✅ Payout details saved successfully:', data[0]?.id)
      return data[0]
    } catch (error) {
      console.error('❌ Failed to save payout details:', error)
      throw error
    }
  }

  // Get user's podcasts
  async getUserPodcasts(userId) {
    try {
      const { data, error } = await this.client
        .from('podcasts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch podcasts: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Failed to get user podcasts:', error)
      throw error
    }
  }

  // Get podcast by Megaphone ID
  async getPodcastByMegaphoneId(megaphoneId) {
    try {
      const { data, error } = await this.client
        .from('podcasts')
        .select('*')
        .eq('megaphone_id', megaphoneId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch podcast: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Failed to get podcast by Megaphone ID:', error)
      throw error
    }
  }

  // Get podcast by channel ID
  async getPodcastByChannelId(channelId) {
    try {
      const { data, error } = await this.client
        .from('podcasts')
        .select('*')
        .eq('channel_id', channelId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch podcast: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Failed to get podcast by channel ID:', error)
      throw error
    }
  }

  // Get user's payout details
  async getPayoutDetails(userId, podcastId = null) {
    try {
      let query = this.client
        .from('payout_details')
        .select('*')
        .eq('user_id', userId)

      if (podcastId) {
        query = query.eq('podcast_id', podcastId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch payout details: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Failed to get payout details:', error)
      throw error
    }
  }

  // Update payout status after Airwallex success/failure
  async updatePayoutStatus(payoutId, status, airwallexBeneficiaryId = null, error = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }

      if (airwallexBeneficiaryId) {
        updateData.airwallex_beneficiary_id = airwallexBeneficiaryId
      }

      if (error) {
        updateData.error_message = error
      }

      const { data, error: updateError } = await this.client
        .from('payout_details')
        .update(updateData)
        .eq('id', payoutId)
        .select()

      if (updateError) {
        throw new Error(`Failed to update payout status: ${updateError.message}`)
      }

      return data[0]
    } catch (error) {
      console.error('❌ Failed to update payout status:', error)
      throw error
    }
  }

  // Delete image from storage
  async deleteImage(fileName, bucket = 'podcast-images') {
    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([fileName])

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Failed to delete image:', error)
      throw error
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()

// Export individual functions for convenience
export const uploadImage = (file, bucket, folder) => 
  supabaseService.uploadImage(file, bucket, folder)

export const savePodcastDetails = (userId, formData, megaphoneResponse) => 
  supabaseService.savePodcastDetails(userId, formData, megaphoneResponse)

export const savePayoutDetails = (userId, podcastId, payoutData) => 
  supabaseService.savePayoutDetails(userId, podcastId, payoutData)

export const getUserPodcasts = (userId) => 
  supabaseService.getUserPodcasts(userId)

export const getPodcastByMegaphoneId = (megaphoneId) => 
  supabaseService.getPodcastByMegaphoneId(megaphoneId)

export const getPodcastByChannelId = (channelId) => 
  supabaseService.getPodcastByChannelId(channelId)

export const getPayoutDetails = (userId, podcastId) => 
  supabaseService.getPayoutDetails(userId, podcastId)

export default supabaseService