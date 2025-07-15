# URL Shortener Microservice 

## What's Inside? 

```
2261375/
├── Backend Test Submission/     # The main star of the show
│   ├── app.js                  # Where all the magic happens
│   ├── package.json            # All the dependencies I needed
│   ├── test-script.js          # Tests to make sure I didn't break anything
│   └── README.md               # More detailed docs for the service
├── Logging Middleware/         # My custom logging solution
│   ├── index.js               # The main entry point
│   ├── logger.js              # Does all the heavy lifting for logging
│   └── package.json           # Just axios, really
└── README.md                  # You're reading it! 📖
```

## Features I Built 

### The URL Shortener Itself
- **Turn long URLs into short ones** - The bread and butter of this project
- **Custom shortcodes** - Want something memorable? Just ask for it!
- **Expiration dates** - Set how long your links should live (default is 30 minutes)
- **Click tracking** - See how many people actually clicked your link
- **Detailed analytics** - I track user agents, IPs, and even mock locations
- **Smart error handling** - It won't crash if you send it weird data

### The Logging System (My Personal Favorite)
- **Tracks everything** - Every request gets a unique ID so I can follow what happened
- **Multiple log levels** - From casual info to "oh no, something broke" fatal errors
- **Retry logic** - If the logging server is down, it tries again (because persistence!)
- **Graceful failure** - Your URLs still work even if logging fails

## Getting Started

### What You'll Need
- Node.js (I used v18, but anything recent should work)
- npm (comes with Node.js)
- A terminal/command prompt
- Maybe 5 minutes of your time

### Get This Running

1. **Grab the code and navigate to it**
   ```bash
   cd 2261375
   ```

2. **Install the main service dependencies**
   ```bash
   cd "Backend Test Submission"
   npm install
   ```

3. **Install the logging middleware dependencies too**
   ```bash
   cd "../Logging Middleware"
   npm install
   cd "../Backend Test Submission"
   ```

4. **Fire it up!**
   ```bash
   npm start
   ```

You should see something like:
```
URL Shortener service running on port 3001
```

## Test

### The Easy Way (I Made a Script)
```bash
node test-script.js
```

This will run through all the main features and tell you if everything's working.


