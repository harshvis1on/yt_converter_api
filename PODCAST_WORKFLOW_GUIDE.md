# Podcast Creation Workflow Guide

## Overview
The enhanced podcast creation workflow integrates with Airwallex for global payouts and Megaphone for podcast hosting, providing a complete end-to-end solution for creators.

## Workflow Steps

### 1. Create Podcast Webhook
- **Endpoint**: `POST /create-podcast`
- **Purpose**: Receives podcast creation data from the frontend onboarding wizard
- **Input**: Complete form data including monetization and payout preferences

### 2. Prepare Data
- **Purpose**: Processes and formats incoming data
- **Functions**:
  - Creates subtitle from description
  - Generates podcast slug from title  
  - Formats iTunes categories array
  - Determines optimal transfer method (LOCAL vs SWIFT) based on bank country

### 3. Create Airwallex Beneficiary
- **API**: `POST https://api.airwallex.com/api/v1/beneficiaries`
- **Purpose**: Creates beneficiary profile for global payouts
- **Features**:
  - Supports both individual and company entities
  - Auto-detects local clearing vs SWIFT transfers
  - Handles 200+ countries via Airwallex
  - Stores bank details securely

### 4. Create Megaphone Podcast
- **API**: `POST https://cms.megaphone.fm/api/networks/{NETWORK_ID}/podcasts`
- **Purpose**: Creates podcast on Megaphone hosting platform
- **Includes**: Title, subtitle, categories, language, distribution type

### 5. Save to Supabase Database
- **API**: `POST {SUPABASE_URL}/rest/v1/podcasts`
- **Purpose**: Stores complete podcast configuration
- **Data Saved**:
  - Basic podcast info (title, description, categories)
  - Monetization preferences (ad volume, placement)
  - Payout configuration (bank details, transfer method)
  - Airwallex beneficiary ID and status
  - Megaphone podcast ID

### 6. Success/Error Handling
- **Success Response**: Returns podcast ID, Airwallex status, and confirmation
- **Error Handling**: Provides detailed error information for debugging
- **Merge Results**: Combines successful and failed operations for comprehensive feedback

## Environment Variables Required

```bash
# Airwallex Configuration
AIRWALLEX_API_KEY=your_airwallex_api_key

# Megaphone Configuration  
MEGAPHONE_NETWORK_ID=your_network_id
MEGAPHONE_API_TOKEN=your_api_token

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Data Flow

### Input Data Structure
```json
{
  "userId": "user_id",
  "channelId": "youtube_channel_id",
  "title": "Podcast Title",
  "description": "Podcast description",
  "author": "Creator Name",
  "language": "en",
  "itunesCategories": ["Technology", "Business"],
  "explicit": "no",
  "podcastType": "episodic",
  "distributionType": "audio",
  "adVolume": "standard",
  "adPlacement": "preroll_midroll",
  "payoutEmail": "creator@example.com",
  "beneficiaryEntityType": "INDIVIDUAL",
  "beneficiaryName": "John Doe",
  "bankCountry": "US",
  "accountCurrency": "USD",
  "bankName": "Chase Bank",
  "accountNumber": "1234567890",
  "routingNumber": "021000021",
  "addressLine1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US"
}
```

### Success Response
```json
{
  "success": true,
  "podcastId": "megaphone_podcast_id",
  "podcast": {
    "id": "megaphone_podcast_id",
    "title": "Podcast Title",
    "distributionType": "audio",
    "adVolume": "standard",
    "createdAt": "2025-01-23T..."
  },
  "airwallex": {
    "beneficiaryId": "airwallex_beneficiary_id",
    "status": "PENDING_VERIFICATION"
  },
  "message": "Podcast created successfully!"
}
```

## Transfer Method Logic

The workflow automatically determines the optimal transfer method:

- **LOCAL**: For countries with local clearing systems (faster, cheaper)
- **SWIFT**: For international transfers (slower, higher fees)

### Local Clearing Countries
US, CA, GB, AU, SG, HK, JP, DE, FR, NL, CN, IN, ID, KR, MY, NZ, PH, TH, VN, BD, NP, PK, LK, TR, AT, BE, BG, HR, CY, CZ, DK, EE, FI, GR, HU, IE, IT, LV, LT, LU, MT, NO, PL, PT, RO, SK, SI, ES, SE, CH, AR, BO, BR, CL, CO, MX, PE, PY, UY, BH, IL, AE

## Error Handling

### Airwallex Beneficiary Creation
- **Continues on error**: Podcast creation proceeds even if beneficiary setup fails
- **Status tracking**: Records failure status for manual review
- **Error details**: Provides specific API error messages

### Megaphone Podcast Creation
- **Critical step**: Failure stops the workflow
- **Detailed errors**: Returns specific Megaphone API errors
- **Retry logic**: Manual retry required for failed creations

### Database Storage
- **Final step**: Ensures all data is persisted
- **Comprehensive data**: Includes all preferences and API responses
- **Status tracking**: Records creation status for monitoring

## Monitoring & Debugging

### Success Metrics
- Successful podcast creations
- Airwallex beneficiary success rate
- Average processing time

### Error Tracking
- API failures by service (Airwallex, Megaphone, Supabase)
- Common validation errors
- Geographic distribution of failures

### Logs to Monitor
- Airwallex beneficiary verification status
- Megaphone podcast approval status
- Database consistency checks

## Security Considerations

### API Keys
- All API keys stored as environment variables
- No sensitive data in workflow JSON
- Secure token handling for all services

### Data Protection
- PII handling compliant with regulations
- Bank details encrypted in transit
- Address information validated for KYC

### Access Control
- Webhook endpoints secured
- Service-to-service authentication
- User data segregation maintained

## Future Enhancements

### Planned Features
1. **Airwallex Payout Automation**: Automatic revenue distribution
2. **Megaphone Analytics Integration**: Revenue and listener metrics
3. **Multi-currency Support**: Dynamic currency conversion
4. **Batch Processing**: Handle multiple podcast creations
5. **Webhook Notifications**: Real-time status updates

### Integration Possibilities
1. **YouTube Analytics**: Import channel metrics
2. **Stripe Integration**: Alternative payment processing
3. **Tax Reporting**: Automated 1099 generation
4. **Content Management**: Episode scheduling and publishing