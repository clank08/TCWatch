# External APIs Setup Guide for TCWatch

This guide provides instructions for obtaining and configuring all external API keys required for TCWatch to function properly.

## Required External APIs

TCWatch integrates with multiple external APIs to provide comprehensive True Crime content tracking. Below are the required APIs and instructions for obtaining access.

---

## 1. Watchmode API (Streaming Availability)

**Purpose**: Provides streaming availability data across 200+ platforms including Netflix, Hulu, Prime Video, and cable networks.

### Registration Process:
1. Visit https://api.watchmode.com/
2. Click "Get API Key" or "Sign Up"
3. Create an account (free tier available)
4. Verify your email address
5. Access your API key from the dashboard

### Pricing Tiers:
- **Free**: 1,000 requests/month
- **Basic**: $10/month - 15,000 requests
- **Pro**: $50/month - 100,000 requests
- **Enterprise**: Custom pricing

### Environment Variables:
```env
WATCHMODE_API_KEY=your_watchmode_api_key_here
WATCHMODE_BASE_URL=https://api.watchmode.com/v1
```

### Testing Your Key:
```bash
curl "https://api.watchmode.com/v1/sources/?apiKey=YOUR_API_KEY"
```

---

## 2. The Movie Database (TMDb) API

**Purpose**: Provides comprehensive movie and TV show metadata, posters, and general information.

### Registration Process:
1. Visit https://www.themoviedb.org/
2. Create an account (free)
3. Go to Settings → API
4. Request an API key (select "Developer" for non-commercial use)
5. Fill out the application form
6. Your API key will be instantly available

### Pricing:
- **Free**: Unlimited requests with rate limiting (40 requests/10 seconds)
- No paid tiers required for most use cases

### Environment Variables:
```env
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

### Testing Your Key:
```bash
curl "https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY"
```

---

## 3. TheTVDB API

**Purpose**: Provides detailed TV series information including episode guides, air dates, and series metadata.

### Registration Process:
1. Visit https://thetvdb.com/api
2. Click "Register" to create an account
3. Verify your email
4. Go to Dashboard → API Keys
5. Generate a new API key
6. Subscribe to a plan if needed

### Pricing Tiers:
- **Free**: Limited to 20 requests/day
- **Subscriber**: $11.95/year - Unlimited requests
- **Commercial**: Contact for pricing

### Environment Variables:
```env
THETVDB_API_KEY=your_thetvdb_api_key_here
THETVDB_BASE_URL=https://api4.thetvdb.com/v4
```

### Testing Your Key:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" "https://api4.thetvdb.com/v4/series"
```

---

## 4. TVMaze API

**Purpose**: Provides TV show schedules, episode information, and airing times.

### Registration Process:
- **No registration required** for basic usage
- Optional registration for higher rate limits

### For Premium Access:
1. Visit https://www.tvmaze.com/api
2. Contact for premium API access
3. Provide use case description
4. Receive API credentials

### Pricing:
- **Free**: Open API with rate limiting (20 requests/10 seconds)
- **Premium**: Contact for pricing

### Environment Variables:
```env
TVMAZE_API_KEY=your_tvmaze_api_key_here_if_premium
TVMAZE_BASE_URL=https://api.tvmaze.com
```

### Testing the API:
```bash
curl "https://api.tvmaze.com/shows/1"
```

---

## 5. Wikidata API

**Purpose**: Provides structured data about criminal cases, perpetrators, and victims for True Crime content.

### Registration:
- **No registration required** - Open access API
- Optional account for higher rate limits

### For Better Rate Limits:
1. Create a Wikimedia account at https://www.wikidata.org/
2. Log in to get user-specific rate limits
3. Use OAuth for authenticated requests (optional)

### Pricing:
- **Free**: Unlimited (with reasonable rate limiting)

### Environment Variables:
```env
WIKIDATA_BASE_URL=https://www.wikidata.org/w/api.php
WIKIDATA_SPARQL_URL=https://query.wikidata.org/sparql
```

### Testing the API:
```bash
curl "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q193582&format=json"
```

---

## Configuration in TCWatch

### 1. Development Environment

Add your API keys to `TC-Backend/.env`:

```env
# External API Configuration
WATCHMODE_API_KEY=your_actual_watchmode_key
TMDB_API_KEY=your_actual_tmdb_key
THETVDB_API_KEY=your_actual_thetvdb_key
TVMAZE_API_KEY=optional_tvmaze_key
# Wikidata doesn't require a key
```

### 2. Production Environment

For production, set these as environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- AWS: Parameter Store or Secrets Manager
- Docker: Use secrets management

### 3. Rate Limiting Configuration

Configure rate limits in `.env` to respect API limits:

```env
# API Rate Limits (requests per minute)
WATCHMODE_RATE_LIMIT=60
TMDB_RATE_LIMIT=40
THETVDB_RATE_LIMIT=20
TVMAZE_RATE_LIMIT=20
WIKIDATA_RATE_LIMIT=30
```

---

## API Usage Priorities

To optimize costs and performance, TCWatch uses APIs in this priority order:

1. **Content Discovery**: TMDb (free) → Watchmode (paid)
2. **TV Episode Data**: TVMaze (free) → TheTVDB (paid)
3. **Streaming Availability**: Watchmode (primary source)
4. **Criminal Case Data**: Wikidata (free)

---

## Testing API Integration

After configuring all API keys, test the integration:

```bash
# Test all external APIs
cd TC-Backend
npm run test:apis

# Test individual APIs
npm run test:watchmode
npm run test:tmdb
npm run test:thetvdb
npm run test:tvmaze
npm run test:wikidata
```

---

## Cost Optimization Tips

### 1. Development
- Use mock data when possible
- Cache API responses aggressively
- Share API keys across team (development only)

### 2. Production
- Implement Redis caching for all API responses
- Use Temporal workflows for batch processing
- Monitor usage through provider dashboards
- Set up alerts for quota approaching

### 3. Caching Strategy
- TMDb data: Cache for 24 hours
- Watchmode availability: Cache for 6 hours
- TheTVDB episode data: Cache for 7 days
- TVMaze schedules: Cache for 12 hours
- Wikidata: Cache for 30 days

---

## Troubleshooting

### Common Issues:

**401 Unauthorized**
- Verify API key is correct
- Check if key is active/not expired
- Ensure proper authentication header format

**429 Too Many Requests**
- Implement rate limiting
- Add exponential backoff
- Check current usage against limits

**503 Service Unavailable**
- API service may be down
- Implement fallback to cached data
- Use circuit breaker pattern

### Support Contacts:

- **Watchmode**: support@watchmode.com
- **TMDb**: Through their forums
- **TheTVDB**: support@thetvdb.com
- **TVMaze**: Through their forums
- **Wikidata**: Community support

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all keys
3. **Rotate keys regularly** in production
4. **Monitor usage** for unusual patterns
5. **Implement rate limiting** on your end
6. **Use separate keys** for dev/staging/production
7. **Audit access logs** regularly

---

## Next Steps

1. Register for all required APIs
2. Add keys to your `.env` file
3. Test each API individually
4. Run integration tests
5. Set up monitoring and alerts
6. Configure production secrets

Remember to keep your API keys secure and never share them publicly!