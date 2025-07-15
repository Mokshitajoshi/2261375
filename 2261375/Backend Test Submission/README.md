# URL Shortener Microservice

A robust HTTP URL Shortener Microservice with analytics capabilities and comprehensive logging.

## Features

- **URL Shortening**: Convert long URLs into short, manageable links
- **Custom Shortcodes**: Support for user-defined shortcodes
- **Expiration Management**: Configurable validity periods (default: 30 minutes)
- **Analytics**: Track access counts and history
- **Comprehensive Logging**: Integrated with custom logging middleware
- **Error Handling**: Robust error handling with appropriate HTTP status codes

## API Endpoints

### 1. Shorten URL
```
POST /api/shorten
```

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url",
  "customShortcode": "mycode", // optional
  "validityMinutes": 60 // optional, defaults to 30
}
```

**Response:**
```json
{
  "shortcode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "shortUrl": "http://localhost:3001/abc123",
  "expiresAt": "2024-01-01T12:30:00.000Z",
  "validityMinutes": 60,
  "requestId": "req123"
}
```

### 2. Get URL Information
```
GET /api/info/:shortcode
```

**Response:**
```json
{
  "shortcode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "expiresAt": "2024-01-01T12:30:00.000Z",
  "accessCount": 5,
  "requestId": "req124"
}
```

### 3. Get Analytics
```
GET /api/analytics/:shortcode
```

**Response:**
```json
{
  "shortcode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "totalAccesses": 5,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "expiresAt": "2024-01-01T12:30:00.000Z",
  "isExpired": false,
  "accessHistory": [...],
  "requestId": "req125"
}
```

### 4. Redirect
```
GET /:shortcode
```

Redirects to the original URL or returns error if expired/not found.

### 5. Health Check
```
GET /api/health
```

## Usage

1. Start the service:
```bash
npm start
```

2. Create a shortened URL:
```bash
curl -X POST http://localhost:3001/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

3. Access the shortened URL:
```bash
curl http://localhost:3001/abc123
```

## Error Handling

The service returns appropriate HTTP status codes:
- `400`: Bad Request (invalid input)
- `404`: Not Found (shortcode doesn't exist)
- `409`: Conflict (custom shortcode already exists)
- `410`: Gone (URL has expired)
- `500`: Internal Server Error

## Logging Integration

All operations are logged using the custom logging middleware with appropriate log levels:
- `info`: Normal operations
- `warn`: Non-critical issues (404s, expired URLs)
- `error`: Client errors (validation failures)
- `fatal`: Server errors