require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const axios = require("axios");
const https = require("https");
const fs = require("fs");

const app = express();

// Global variables
let authorizationCode;
let accessToken;
let refreshToken;

// Load from .env file
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

// Start the HTTPS server
function startServer() {
  return new Promise((resolve, reject) => {
    const httpsOptions = {
      key: fs.readFileSync("server-key.pem"), // Don't forget to create your Self Signed SSL Cert
      cert: fs.readFileSync("server-cert.pem"), // Don't forget to create your Self Signed SSL Cert
    };

    const server = https.createServer(httpsOptions, app);

    // Listen for GET requests on /
    app.get("/", (req, res) => {
      // Extract URL parameters
      authorizationCode = req.query.code;

      if (!authorizationCode) {
        return res.status(400).send("Missing authorization code");
      }

      // Call the getAuthToken function
      getAuthToken()
        .then((tokens) => {
          // Send response to client
          res.send("Authorization process completed. Check the logs for details.");
          resolve(tokens); // Resolve with the tokens once received
        })
        .catch(reject);
    });

    // Start the server
    server.listen(443, () => {
      console.log("Express server is listening on port 443")  // C2bDgVTOPYPmSv4A8zfrA6IFE31A31UO
      console.log(`https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${clientId}&scope=readonly&redirect_uri=${redirectUri}`)
    });

    // Set a timeout to close the server after 60 seconds if no authorization code is received
    setTimeout(() => {
      if (!authorizationCode) {
        console.log("Timeout: No authorization code received. Shutting down the server.");
        server.close(() => resolve(null));
      }
    }, 60000);
  });
}

// Function to fetch the auth token
async function getAuthToken() {
  // Base64 encode the client_id:client_secret
  const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  try {
    fs.writeFileSync('/Users/scottike/SPX/.clientcreds', base64Credentials);
  } catch (err) {
    console.error('Error saving Client Credentials:', err);
  }

  try {
    const response = await axios({
      method: "POST",
      url: "https://api.schwabapi.com/v1/oauth/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Credentials}`,
      },
      data: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${redirectUri}`,
    });

    console.log("*** GOT NEW AUTH TOKEN ***");

    // Log the refresh_token and access_token before exiting
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    try {
      fs.writeFileSync('/Users/scottike/SPX/.access', accessToken);
    } catch (err) {
      console.error('Error saving Access Token:', err);
    }
    try {
      fs.writeFileSync('/Users/scottike/SPX/.refresh', refreshToken);
    } catch (err) {
      console.error('Error saving Access Token:', err);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching auth token:", error);
    throw error;
  }
}


async function getAccounts() {
  console.log("*** API TEST CALL: ACCOUNTS ***");

  const res = await axios({
    method: "GET",
    url: "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
    contentType: "application/json",
    headers: {
      "Accept-Encoding": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });

  console.log(res.data);

}


// Main function to coordinate the server and Puppeteer
async function main() {
  // Start the HTTPS server
  const serverPromise = startServer();

  // Wait for the server to finish (either timeout or successful authorization)
  const tokens = await serverPromise;

  if (tokens) {
    console.log("Authorization process completed successfully.");

    // Test api with new accessToken
    await getAccounts();

  } else {
    console.log("No tokens received within the timeout period.");
  }

  process.exit();
}

main().catch(console.error);
