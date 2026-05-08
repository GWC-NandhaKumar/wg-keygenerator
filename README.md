# Cleverbridge License Key Generator Backend

Simple and production-ready Node.js + Express backend for Cleverbridge checkout redirect flow.

## Features

- `POST /api/cleverbridge/keygen` receives Cleverbridge form payload
- Parses `req.body.JSON` using `JSON.parse` (JSON only, no XML)
- Generates license key in format `WG-XXXX-XXXX`
- Returns `licenseKey` and `redirectUrl`
- `GET /health` endpoint for uptime checks
- Uses `helmet`, `cors`, `dotenv`

## Tech Stack

- Node.js
- Express
- dotenv
- cors
- helmet
- uuid

## Project Structure

```text
project/
  server.js
  package.json
  .env.example
  README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start server:

```bash
npm start
```

Server runs on `http://localhost:3000` by default.

## Environment Variables

```env
PORT=3000
DASHBOARD_URL=https://dashboard.example.com
```

## Endpoints

### Health Check

- Method: `GET`
- URL: `/health`
- Response:

```json
{
  "status": "ok"
}
```

### Swagger UI (API Testing)

- URL: `http://localhost:3000/api-docs`
- Raw OpenAPI JSON: `http://localhost:3000/api-docs.json`

Use Swagger UI to test `GET /health` and `POST /api/cleverbridge/keygen` directly from browser.

### Cleverbridge Key Generation

- Method: `POST`
- URL: `/api/cleverbridge/keygen`
- Content-Type: `application/x-www-form-urlencoded`
- Accepted form fields:
  - `PURCHASE_ID`
  - `PRODUCT_ID` (optional)
  - `EMAIL`
  - `FIRSTNAME`
  - `LASTNAME`
  - `JSON`

`JSON` is parsed using:

```js
JSON.parse(req.body.JSON);
```

The backend extracts:

- `purchaseId`
- `productId`
- customer email
- customer name
- `subscriptionId` (if present)
- plus all raw incoming fields from `req.body`

`PURCHASE_ID` is required. `PRODUCT_ID` is optional.

## Success Response

```json
{
  "success": true,
  "licenseKey": "WG-A1B2-C3D4",
  "redirectUrl": "https://dashboard.example.com/billing/success?purchaseId=12345&productId=999",
  "receivedData": {
    "PURCHASE_ID": "12345",
    "PRODUCT_ID": "999",
    "EMAIL": "jane@example.com"
  },
  "parsedData": {
    "purchaseId": "12345",
    "productId": "999",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "subscriptionId": "sub_001"
  }
}
```

## Error Response

HTTP `500`:

```json
{
  "success": false,
  "message": "License generation failed"
}
```

## curl Example

```bash
curl -X POST "http://localhost:3000/api/cleverbridge/keygen" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "PURCHASE_ID=12345" \
  --data-urlencode "PRODUCT_ID=999" \
  --data-urlencode "EMAIL=jane@example.com" \
  --data-urlencode "FIRSTNAME=Jane" \
  --data-urlencode "LASTNAME=Doe" \
  --data-urlencode 'JSON={"PaidOrderNotification":{"PurchaseId":"12345","ProductId":"999","SubscriptionId":"sub_001","Customer":{"Email":"jane@example.com","FirstName":"Jane","LastName":"Doe"}}}'
```

## Postman Example

- Method: `POST`
- URL: `http://localhost:3000/api/cleverbridge/keygen`
- Body: `x-www-form-urlencoded`
- Fields:
  - `PURCHASE_ID` = `12345`
  - `PRODUCT_ID` = `999`
  - `EMAIL` = `jane@example.com`
  - `FIRSTNAME` = `Jane`
  - `LASTNAME` = `Doe`
  - `JSON` = `{"PaidOrderNotification":{"PurchaseId":"12345","ProductId":"999","SubscriptionId":"sub_001","Customer":{"Email":"jane@example.com","FirstName":"Jane","LastName":"Doe"}}}`

## Sample Cleverbridge Request Body

```text
PURCHASE_ID=12345
PRODUCT_ID=999
EMAIL=jane@example.com
FIRSTNAME=Jane
LASTNAME=Doe
JSON={"PaidOrderNotification":{"PurchaseId":"12345","ProductId":"999","SubscriptionId":"sub_001","Customer":{"Email":"jane@example.com","FirstName":"Jane","LastName":"Doe"}}}
```

## Deploy Notes

- Set environment variables in your hosting platform
- Keep `DASHBOARD_URL` pointing to your production dashboard
- Add HTTPS in production (handled by most platforms/load balancers)
