require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const axios = require("axios");
const https = require("https");
const fs = require("fs");

const app = express();

// Global variables
let accessToken
let refreshToken
let old_accessToken
let old_refreshToken

// Load from .env file
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

async function refreshAuthToken() {
  console.log("*** REFRESHING ACCESS TOKEN ***");

  // Base64 encode the client_id:client_secret
  const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {

    old_accessToken = fs.readFileSync("/Users/scottike/SPX/.access", "utf-8")
    old_refreshToken = fs.readFileSync("/Users/scottike/SPX/.refresh", "utf-8")

    const response = await axios({
      method: "POST",
      url: "https://api.schwabapi.com/v1/oauth/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Credentials}`,
      },
      data: `grant_type=refresh_token&refresh_token=${old_refreshToken}`,
    })

    // Log the new refresh_token and access_token
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    console.log("New Refresh Token:", response.data.refresh_token)
    console.log("New Access Token:", response.data.access_token)
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

    return response.data

  } catch (error) {
    console.error("Error refreshing auth token:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getAccounts() {

  try {
    const res = await axios({
      method: "GET",
      url: "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
      contentType: "application/json",
      headers: {
        "Accept-Encoding": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });
    console.log("*** TESTING NEW ACCESS TOKEN: SUCCESS ***")
  } catch (err) {
    console.log("*** TESTING NEW ACCESS TOKEN: FAILURE ***")
  }

}




// Main function to coordinate the server and Puppeteer
async function main() {

    // Get new Access Token
  await refreshAuthToken();

    // Test api with refreshed accessToken
  await getAccounts();

  process.exit();

}

main().catch(console.error);
