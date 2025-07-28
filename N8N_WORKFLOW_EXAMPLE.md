# N8N Workflow for Complete Backend Integration

## Workflow Overview

This N8N workflow handles the complete podcast creation process with Supabase integration:

1. **Webhook Trigger** - Receives form data from frontend
2. **Prepare Data** - Cleans and formats data
3. **Megaphone Create Podcast** - Creates podcast in Megaphone
4. **Supabase Save Podcast** - Saves podcast details to Supabase
5. **Airwallex Create Beneficiary** - Creates payout beneficiary  
6. **Supabase Save Payout** - Saves payout details to Supabase
7. **Return Response** - Sends success/error back to frontend

## Node Configuration

### 1. Webhook Trigger
- **Method**: POST
- **Path**: `/webhook-test/create-podcast`
- **Response Mode**: Respond When Last Node Finishes

### 2. Prepare Data (Code Node)
```javascript
// Clean and prepare data for Megaphone
const formData = $input.first().json.body;

// Remove emojis and special characters from text fields
const cleanText = (text) => text ? text.replace(/[^\w\s-.,!?]/g, '').trim() : '';

// Filter out empty categories
const itunesCategories = formData.itunesCategories 
  ? formData.itunesCategories.filter(cat => cat && cat.trim())
  : [formData.primaryCategory].filter(Boolean);

const cleanedData = {
  ...formData,
  title: cleanText(formData.title),
  author: cleanText(formData.author),
  itunesCategories: itunesCategories,
  explicit: formData.explicit === 'yes' ? 'explicit' : 
           formData.explicit === 'no' ? 'clean' : 
           formData.explicit,
  slug: formData.title ? formData.title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) : ''
};

return { body: cleanedData };
```

### 3. Megaphone Create Podcast (HTTP Request)
- **Method**: POST
- **URL**: `https://api.megaphone.fm/v1/podcasts`
- **Authentication**: 
  - Type: Generic Credential Type
  - Name: Authorization
  - Value: `Token YOUR_MEGAPHONE_TOKEN`
- **Content-Type**: `application/x-www-form-urlencoded`

**Body Parameters:**
```
title: {{ $('Prepare Data').item.json.body.title }}
subtitle: {{ $('Prepare Data').item.json.body.subtitle }}
summary: {{ $('Prepare Data').item.json.body.summary }}
itunesCategories[]: {{ $('Prepare Data').item.json.body.primaryCategory }}
language: {{ $('Prepare Data').item.json.body.language }}
link: {{ $('Prepare Data').item.json.body.link }}
copyright: {{ $('Prepare Data').item.json.body.copyright }}
author: {{ $('Prepare Data').item.json.body.author }}
imageFile: {{ $('Prepare Data').item.json.body.backgroundImageFileUrl }}
explicit: {{ $('Prepare Data').item.json.body.explicit }}
ownerName: {{ $('Prepare Data').item.json.body.ownerName }}
ownerEmail: {{ $('Prepare Data').item.json.body.ownerEmail }}
podcastType: {{ $('Prepare Data').item.json.body.podcastType }}
slug: {{ $('Prepare Data').item.json.body.slug }}
externalId: {{ $('Prepare Data').item.json.body.channelId }}
```

### 4. Supabase Save Podcast (HTTP Request)
- **Method**: POST
- **URL**: `https://YOUR_SUPABASE_URL/rest/v1/podcasts`
- **Headers**:
  ```
  Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
  apikey: YOUR_SUPABASE_ANON_KEY
  Content-Type: application/json
  Prefer: return=representation
  ```

**Body (JSON):**
```json
{
  "user_id": "{{ $('Prepare Data').item.json.body.userId }}",
  "channel_id": "{{ $('Prepare Data').item.json.body.channelId }}",
  "megaphone_id": "{{ $('Megaphone Create Podcast').item.json[0].id }}",
  "megaphone_uid": "{{ $('Megaphone Create Podcast').item.json[0].uid }}",
  "feed_url": "{{ $('Megaphone Create Podcast').item.json[0].feedUrl }}",
  "network_id": "{{ $('Megaphone Create Podcast').item.json[0].networkId }}",
  "title": "{{ $('Megaphone Create Podcast').item.json[0].title }}",
  "subtitle": "{{ $('Megaphone Create Podcast').item.json[0].subtitle }}",
  "summary": "{{ $('Megaphone Create Podcast').item.json[0].summary }}",
  "author": "{{ $('Megaphone Create Podcast').item.json[0].author }}",
  "language": "{{ $('Megaphone Create Podcast').item.json[0].language }}",
  "explicit": "{{ $('Megaphone Create Podcast').item.json[0].explicit }}",
  "primary_category": "{{ $('Prepare Data').item.json.body.primaryCategory }}",
  "secondary_category": "{{ $('Prepare Data').item.json.body.secondaryCategory }}",
  "podcast_type": "{{ $('Megaphone Create Podcast').item.json[0].podcastType }}",
  "copyright": "{{ $('Megaphone Create Podcast').item.json[0].copyright }}",
  "owner_name": "{{ $('Megaphone Create Podcast').item.json[0].ownerName }}",
  "owner_email": "{{ $('Megaphone Create Podcast').item.json[0].ownerEmail }}",
  "link": "{{ $('Megaphone Create Podcast').item.json[0].link }}",
  "image_url": "{{ $('Prepare Data').item.json.body.backgroundImageFileUrl }}",
  "megaphone_image_url": "{{ $('Megaphone Create Podcast').item.json[0].imageFile }}",
  "status": "active",
  "episodes_count": "{{ $('Megaphone Create Podcast').item.json[0].episodesCount }}",
  "episode_limit": "{{ $('Megaphone Create Podcast').item.json[0].episodeLimit }}",
  "itunes_active": "{{ $('Megaphone Create Podcast').item.json[0].itunesActive }}",
  "slug": "{{ $('Megaphone Create Podcast').item.json[0].slug }}",
  "megaphone_created_at": "{{ $('Megaphone Create Podcast').item.json[0].createdAt }}",
  "megaphone_updated_at": "{{ $('Megaphone Create Podcast').item.json[0].updatedAt }}"
}
```

### 5. Airwallex Create Beneficiary (HTTP Request)
- **Method**: POST
- **URL**: `https://api-demo.airwallex.com/api/v1/beneficiaries/create`
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{ $('Airwallex Auth').item.json.token }}
  ```

**Body (JSON):**
```json
{
  "beneficiary": {
    "entity_type": "{{ $('Prepare Data').item.json.body.beneficiaryEntityType }}",
    "type": "BANK_ACCOUNT",
    "first_name": "{{ $('Prepare Data').item.json.body.beneficiaryFirstName }}",
    "last_name": "{{ $('Prepare Data').item.json.body.beneficiaryLastName }}",
    "company_name": "{{ $('Prepare Data').item.json.body.beneficiaryName }}",
    "address": {
      "street_address": "{{ $('Prepare Data').item.json.body.addressLine1 }}{{ $('Prepare Data').item.json.body.addressLine2 ? ', ' + $('Prepare Data').item.json.body.addressLine2 : '' }}",
      "city": "{{ $('Prepare Data').item.json.body.city }}",
      "state": "{{ $('Prepare Data').item.json.body.state }}",
      "postcode": "{{ $('Prepare Data').item.json.body.postalCode }}",
      "country_code": "{{ $('Prepare Data').item.json.body.country }}"
    },
    "bank_details": {
      "account_name": "{{ $('Prepare Data').item.json.body.beneficiaryEntityType === 'PERSONAL' ? $('Prepare Data').item.json.body.beneficiaryFirstName + ' ' + $('Prepare Data').item.json.body.beneficiaryLastName : $('Prepare Data').item.json.body.beneficiaryName }}",
      "account_number": "{{ $('Prepare Data').item.json.body.accountNumber }}",
      "account_currency": "{{ $('Prepare Data').item.json.body.accountCurrency }}",
      "account_routing_type1": "{{ $('Prepare Data').item.json.body.bankCountry === 'US' ? 'aba' : $('Prepare Data').item.json.body.bankCountry === 'GB' ? 'sort_code' : 'routing_number' }}",
      "account_routing_value1": "{{ $('Prepare Data').item.json.body.routingNumber }}",
      "bank_country_code": "{{ $('Prepare Data').item.json.body.bankCountry }}",
      "local_clearing_system": "{{ $('Prepare Data').item.json.body.transferMethod === 'LOCAL' ? 'ACH' : null }}"
    },
    "additional_info": {
      "personal_email": "{{ $('Prepare Data').item.json.body.payoutEmail }}"
    }
  },
  "nickname": "{{ $('Prepare Data').item.json.body.beneficiaryEntityType === 'PERSONAL' ? $('Prepare Data').item.json.body.beneficiaryFirstName + ' ' + $('Prepare Data').item.json.body.beneficiaryLastName : $('Prepare Data').item.json.body.beneficiaryName }}",
  "transfer_methods": ["{{ $('Prepare Data').item.json.body.transferMethod || 'LOCAL' }}"]
}
```

### 6. Supabase Save Payout (HTTP Request)
- **Method**: POST
- **URL**: `https://YOUR_SUPABASE_URL/rest/v1/payout_details`
- **Headers**: Same as Supabase Save Podcast

**Body (JSON):**
```json
{
  "user_id": "{{ $('Prepare Data').item.json.body.userId }}",
  "podcast_id": "{{ $('Supabase Save Podcast').item.json[0].id }}",
  "beneficiary_entity_type": "{{ $('Prepare Data').item.json.body.beneficiaryEntityType }}",
  "beneficiary_name": "{{ $('Prepare Data').item.json.body.beneficiaryName }}",
  "beneficiary_first_name": "{{ $('Prepare Data').item.json.body.beneficiaryFirstName }}",
  "beneficiary_last_name": "{{ $('Prepare Data').item.json.body.beneficiaryLastName }}",
  "payout_email": "{{ $('Prepare Data').item.json.body.payoutEmail }}",
  "bank_country": "{{ $('Prepare Data').item.json.body.bankCountry }}",
  "account_currency": "{{ $('Prepare Data').item.json.body.accountCurrency }}",
  "bank_name": "{{ $('Prepare Data').item.json.body.bankName }}",
  "account_number": "{{ $('Prepare Data').item.json.body.accountNumber }}",
  "routing_number": "{{ $('Prepare Data').item.json.body.routingNumber }}",
  "transfer_method": "{{ $('Prepare Data').item.json.body.transferMethod }}",
  "address_line1": "{{ $('Prepare Data').item.json.body.addressLine1 }}",
  "address_line2": "{{ $('Prepare Data').item.json.body.addressLine2 }}",
  "city": "{{ $('Prepare Data').item.json.body.city }}",
  "state": "{{ $('Prepare Data').item.json.body.state }}",
  "postal_code": "{{ $('Prepare Data').item.json.body.postalCode }}",
  "country": "{{ $('Prepare Data').item.json.body.country }}",
  "airwallex_beneficiary_id": "{{ $('Airwallex Create Beneficiary').item.json.beneficiary.id }}",
  "status": "active"
}
```

### 7. Return Response (Code Node)
```javascript
const prepareData = $('Prepare Data').first().json;
const megaphoneData = $('Megaphone Create Podcast').first().json;
const supabaseData = $('Supabase Save Podcast').first().json;
const airwallexData = $('Airwallex Create Beneficiary').first().json;
const payoutData = $('Supabase Save Payout').first().json;

return {
  success: true,
  podcast: megaphoneData[0],
  podcastId: megaphoneData[0].id,
  megaphoneUid: megaphoneData[0].uid,
  feedUrl: megaphoneData[0].feedUrl,
  supabasePodcastId: supabaseData[0].id,
  supabasePodcast: supabaseData[0],
  airwallexBeneficiaryId: airwallexData.beneficiary.id,
  payoutId: payoutData[0].id,
  message: 'Podcast and payout setup completed successfully'
};
```

## Error Handling

Add error handling nodes after each HTTP request:
- **If** node checking for successful status codes
- **Set** node for error responses
- Continue workflow even if Airwallex fails

## Testing

1. Update Supabase table schema using `supabase-schema.sql`
2. Configure all N8N nodes with your credentials
3. Test with sample data from frontend
4. Verify data appears correctly in Supabase tables

This workflow provides complete backend integration with proper data persistence!