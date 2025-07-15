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

### Requirements
- Node.js (I used v18, but anything recent should work)
- npm (comes with Node.js)
- A terminal/command prompt


### how to run

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

### A script
```bash
node test-script.js
```

This will run through all the main features and tell you if everything's working.


