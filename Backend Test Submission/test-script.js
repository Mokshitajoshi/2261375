const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log(' Starting URL Shortener Test Suite...\n');

  try {
    // 1️ Health Check
    console.log(' Checking server health...');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log(` Server is healthy. Status: ${healthRes.data.status}\n`);

    // 2️ Shorten a URL
    console.log(' Creating a shortened URL...');
    const originalUrl = 'https://www.google.com/search?q=valid+url+test';
    const shortenRes = await axios.post(`${BASE_URL}/shorturls`, {
      url: originalUrl
    });

    const shortLink = shortenRes.data.shortLink;
    const expiry = shortenRes.data.expiry;
    const shortcode = shortLink.split('/').pop();

    console.log(` Short URL created!`);
    console.log(`   🔸 Original URL: ${originalUrl}`);
    console.log(`   🔸 Short URL   : ${shortLink}`);
    console.log(`   🔸 Expires At : ${expiry}\n`);

    // 3️ Fetch Short URL Info & Analytics
    console.log(' Fetching URL statistics and analytics...');
    const statsRes = await axios.get(`${BASE_URL}/shorturls/${shortcode}`);
    console.log(` Stats retrieved!`);
    console.log(`   🔹 Access Count   : ${statsRes.data.accessCount}`);
    console.log(`   🔹 Created At     : ${statsRes.data.createdAt}`);
    console.log(`   🔹 Expiration     : ${statsRes.data.expiresAt}`);
    console.log(`   🔹 Original URL   : ${statsRes.data.originalUrl}\n`);

    // 4️ Test Redirect Behavior
    console.log(' Testing redirection...');
    try {
      await axios.get(`${BASE_URL}/${shortcode}`, { maxRedirects: 0 });
    } catch (err) {
      if (err.response && err.response.status === 302) {
        console.log(` Redirect working!  Redirects to: ${err.response.headers.location}`);
      } else {
        throw err;
      }
    }

    //  Done!
    console.log('\n All tests completed successfully!');
    console.log(` Try it yourself: ${shortLink}\n`);
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message;
    console.error(` Something went wrong during testing:\n    ${errorMessage}`);
  }
}

runTests();
