# URL Shortener System Design 🏗️

## Overview

This document outlines the system design for my URL shortener microservice. Think of this as the blueprint that explains how everything fits together and why I made certain decisions.

## High-Level Architecture 🎯

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Client Apps   │───▶│  URL Shortener   │───▶│ Logging Service │
│  (Browser/API)  │    │   Microservice   │    │  (External)     │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │              │
                       │  In-Memory   │
                       │   Storage    │
                       │   (Maps)     │
                       │              │
                       └──────────────┘
```

## Core Components 🧩

### 1. URL Shortener Service (`app.js`)
**What it does:** The main Express.js application that handles all URL operations

**Key responsibilities:**
- Receives URL shortening requests
- Generates or validates shortcodes
- Stores URL mappings
- Handles redirections
- Tracks analytics
- Manages expiration logic

**Why I built it this way:**
- Single responsibility principle - one service, one job
- Express.js for simplicity and speed
- RESTful API design for easy integration

### 2. Logging Middleware (`Logging Middleware/`)
**What it does:** A reusable logging component that can be plugged into any Node.js app

**Key responsibilities:**
- Captures all application events
- Assigns unique request IDs
- Implements retry logic for external logging
- Provides multiple log levels
- Fails gracefully when external service is down

**Why I separated it:**
- Reusability across different projects
- Separation of concerns
- Independent deployment and testing
- Could easily be published as an npm package

### 3. Data Storage Layer
**What it does:** In-memory storage using JavaScript Maps

**Current implementation:**
```javascript
const urlDatabase = new Map();    // shortcode -> URL data
const analytics = new Map();      // shortcode -> access history
```

**Why Maps instead of arrays:**
- O(1) lookup time for redirects (super important for performance)
- Built-in key uniqueness
- Easy to check if shortcode exists
- Simple to implement and understand

## Data Models 📊

### URL Data Structure
```javascript
{
  originalUrl: "https://example.com/very/long/url",
  shortcode: "abc123",
  createdAt: "2024-01-01T12:00:00.000Z",
  expiresAt: "2024-01-01T12:30:00.000Z",
  accessCount: 5
}
```

### Analytics Data Structure
```javascript
[
  {
    timestamp: "2024-01-01T12:05:00.000Z",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    ip: "192.168.1.1",
    location: "India" // Mock data for demo
  }
]
```

### Log Data Structure
```javascript
{
  stack: "backend",
  level: "info",
  package: "api",
  message: "URL shortened successfully",
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

## API Design Philosophy 🎨

### RESTful Principles
I followed REST conventions where they made sense:

| HTTP Method | Endpoint | Purpose | Why This Design |
|-------------|----------|---------|-----------------|
| `POST` | `/api/shorten` | Create short URL | POST for creation |
| `GET` | `/api/info/:code` | Get URL metadata | GET for data retrieval |
| `GET` | `/api/analytics/:code` | Get detailed analytics | Separate endpoint for heavy data |
| `GET` | `/:code` | Redirect to original | Simple, clean redirect |
| `GET` | `/api/health` | Health check | Standard monitoring endpoint |

### Why These Endpoints?
- **`/api/shorten`** - Clear intent, follows REST conventions
- **`/:shortcode`** - Shortest possible path for redirects (user experience!)
- **Separate info vs analytics** - Different use cases, different data volumes
- **`/api/` prefix** - Distinguishes API calls from redirect URLs

## Request Flow 🔄

### URL Shortening Flow
```
1. Client sends POST /api/shorten with URL
2. Middleware assigns request ID and logs
3. Validate URL format
4. Check if custom shortcode provided
   ├─ If yes: validate format and uniqueness
   └─ If no: generate random shortcode
5. Calculate expiration time
6. Store in urlDatabase
7. Initialize analytics array
8. Log success
9. Return shortcode and metadata
```

### Redirect Flow
```
1. Client requests GET /:shortcode
2. Middleware logs request
3. Look up shortcode in urlDatabase
4. Check if URL exists
5. Check if URL has expired
6. Increment access counter
7. Record analytics data
8. Log successful redirect
9. Send 302 redirect to original URL
```

## Error Handling Strategy 🚨

### Validation Errors (400)
- Invalid URL format
- Invalid shortcode format
- Missing required fields

**Why 400:** Client sent bad data, they need to fix it

### Not Found (404)
- Shortcode doesn't exist

**Why 404:** Standard "resource not found" response

### Conflict (409)
- Custom shortcode already exists

**Why 409:** Resource conflict, client needs to choose different shortcode

### Gone (410)
- URL has expired

**Why 410:** Resource existed but is no longer available (more specific than 404)

### Server Error (500)
- Unexpected errors
- Database/storage failures

**Why 500:** Something went wrong on our end

## Performance Considerations ⚡

### Why In-Memory Storage?
**Pros:**
- Lightning fast O(1) lookups
- No network latency
- Simple to implement
- Perfect for demo/prototype

**Cons:**
- Data lost on restart
- Limited by RAM
- No persistence
- Single point of failure

### Shortcode Generation Strategy
```javascript
function generateShortcode() {
  return nanoid(6); // 6 characters = 64^6 = ~68 billion combinations
}
```

**Why nanoid:**
- URL-safe characters only
- Cryptographically strong
- No collisions in practice
- Configurable length

**Why 6 characters:**
- Good balance of brevity vs collision resistance
- 68+ billion possible combinations
- Short enough to type manually
- Long enough to avoid conflicts

## Scalability Considerations 📈

### Current Limitations
1. **Single server** - No horizontal scaling
2. **In-memory storage** - Limited by RAM
3. **No caching** - Every request hits main storage
4. **No load balancing** - Single point of failure

### How I'd Scale This

#### Phase 1: Database Integration
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│ URL Service  │───▶│ PostgreSQL  │
└─────────────┘    └──────────────┘    └─────────────┘
```

#### Phase 2: Caching Layer
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│ URL Service  │───▶│    Redis    │───▶│ PostgreSQL  │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

#### Phase 3: Microservices
```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ URL Service │ │ URL Service │ │ URL Service │
    │ Instance 1  │ │ Instance 2  │ │ Instance 3  │
    └─────────────┘ └─────────────┘ └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │ Shared Database │
                    └─────────────────┘
```

## Security Considerations 🔒

### Current Implementation
- **Input validation** - URL format checking
- **Shortcode validation** - Alphanumeric only
- **No authentication** - Open service (demo purposes)

### Production Considerations
- **Rate limiting** - Prevent abuse
- **Authentication** - API keys or user accounts
- **URL validation** - Check for malicious sites
- **HTTPS only** - Secure transmission
- **Input sanitization** - Prevent injection attacks

## Monitoring & Observability 📊

### Current Logging
- **Request tracking** - Unique IDs for each request
- **Operation logging** - Every major operation logged
- **Error tracking** - All errors captured
- **Performance metrics** - Basic timing information

### What I'd Add
- **Metrics collection** - Response times, error rates
- **Health checks** - Detailed system health
- **Alerting** - Automated issue detection
- **Distributed tracing** - Request flow across services

## Technology Choices 🛠️

### Why Express.js?
- **Simplicity** - Minimal setup, fast development
- **Ecosystem** - Huge middleware ecosystem
- **Performance** - Good enough for most use cases
- **Familiarity** - Well-known framework

### Why nanoid?
- **Security** - Cryptographically strong
- **Performance** - Faster than uuid
- **Size** - Smaller bundle size
- **Customization** - Configurable alphabet and length

### Why In-Memory Maps?
- **Speed** - Fastest possible lookups
- **Simplicity** - No external dependencies
- **Development** - Easy to debug and test

## Testing Strategy 🧪

### Current Tests
- **Integration tests** - Full API workflow testing
- **Manual testing** - cURL commands and browser testing
- **Error scenario testing** - Invalid inputs and edge cases

### What I'd Add
- **Unit tests** - Individual function testing
- **Load testing** - Performance under stress
- **Security testing** - Vulnerability scanning
- **End-to-end testing** - Full user journey testing

## Deployment Considerations 🚀

### Current Setup
- **Local development** - npm start
- **Single process** - No clustering
- **No containerization** - Direct Node.js execution

### Production Ready
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Configuration
```bash
# .env example
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Future Enhancements 🔮

### Short Term (1-2 weeks)
- [ ] Database integration (PostgreSQL)
- [ ] Basic authentication
- [ ] Rate limiting
- [ ] Docker containerization

### Medium Term (1-2 months)
- [ ] Redis caching layer
- [ ] User accounts and dashboards
- [ ] Custom domains
- [ ] QR code generation
- [ ] Link preview safety

### Long Term (3-6 months)
- [ ] Microservices architecture
- [ ] Advanced analytics
- [ ] A/B testing for links
- [ ] API versioning
- [ ] Multi-region deployment

## Lessons Learned 📚

### What Went Well
- **Simple architecture** - Easy to understand and modify
- **Good separation of concerns** - Logging middleware is reusable
- **Comprehensive error handling** - Covers most edge cases
- **Clear API design** - Intuitive endpoints

### What I'd Do Differently
- **Start with database** - In-memory storage is limiting
- **Add tests earlier** - Would have caught issues sooner
- **Environment configuration** - Hard-coded values are problematic
- **Better documentation** - More inline code comments

### Key Takeaways
1. **Start simple** - Get the core functionality working first
2. **Plan for scale** - Even if you don't implement it initially
3. **Logging is crucial** - Helps debug issues in production
4. **Error handling matters** - Users need clear feedback
5. **Documentation saves time** - For yourself and others

---

*This system design reflects the current implementation and my thoughts on how to evolve it. It's a living document that should be updated as the system grows and requirements change.*