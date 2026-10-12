# Zuu Agent — Facebook Publishing & Meta Graph API Integration

## Overview
Zuu Agent integrates with the official **Meta Graph API (v21.0)** to publish automated text and media posts to authorized Facebook Pages.

---

## 1. Prerequisites from Meta Developer Portal
1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com) of type **Business**.
2. Add the **Facebook Login for Business** and **Graph API** products.
3. In App Review / Permissions, request:
   - `pages_manage_posts` (Required to publish feeds and photos)
   - `pages_read_engagement` (Required to verify post performance)
   - `pages_show_list` (Required to list authorized Pages)

---

## 2. Generating a Permanent Page Access Token
1. Open the **Graph API Explorer** in Meta Developer Tools.
2. Select your App and generate a User Access Token with the required scopes.
3. Call `GET /me/accounts` to retrieve your Page ID and Page Access Token.
4. Exchange the token for a long-lived Never-Expiring Page Token:
```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
```

---

## 3. Idempotency & Duplicate Prevention
Before dispatching any publication request, Zuu Agent generates a cryptographic `idempotency_key` (e.g. `idemp_corr_troll_20261012_01`).
- If an API request times out or retries, Zuu Agent checks the stored idempotency cache before initiating another request.
- This guarantees that network hiccups will **never result in duplicate posts** on the Facebook Page.

---

## 4. Dry-Run Simulation Mode
Zuu Agent includes full dry-run simulation mode out of the box.
- When dry-run is enabled, the platform executes the entire 16-step pipeline, runs the AI model, enforces approval gates, and simulates the Graph API response with realistic simulated post IDs.
- You can fully configure, test, and preview Trollogiya without connecting real Facebook credentials.
- Toggle live publishing when your Page Access Token is ready in **API & Integrations**.
