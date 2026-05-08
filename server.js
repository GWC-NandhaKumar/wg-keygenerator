require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { v4: uuidv4 } = require("uuid");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = process.env.PORT || 3000;
const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://dashboard.example.com";

app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (_req, res) => {
  return res.status(200).json(swaggerDocument);
});
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

function generateLicenseKey() {
  const token = uuidv4().replace(/-/g, "").toUpperCase().slice(0, 8);
  return `WG-${token.slice(0, 4)}-${token.slice(4, 8)}`;
}

function parseCleverbridgeJson(rawJson) {
  if (!rawJson) {
    return {};
  }

  const parsed = JSON.parse(rawJson);
  const paidOrder = parsed?.PaidOrderNotification || {};

  const purchaseId = paidOrder.PurchaseId || paidOrder.PurchaseID || null;
  const productId = paidOrder.ProductId || paidOrder.ProductID || null;
  const subscriptionId = paidOrder.SubscriptionId || paidOrder.SubscriptionID || null;
  const customer = paidOrder.Customer || {};

  return {
    purchaseId,
    productId,
    email: customer.Email || null,
    firstName: customer.FirstName || null,
    lastName: customer.LastName || null,
    subscriptionId
  };
}

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.post("/api/cleverbridge/keygen", (req, res) => {
  try {
    const {
      PURCHASE_ID,
      PRODUCT_ID,
      EMAIL,
      FIRSTNAME,
      LASTNAME,
      JSON: rawJson
    } = req.body;

    const parsedJson = parseCleverbridgeJson(rawJson);

    const purchaseId = parsedJson.purchaseId || PURCHASE_ID;
    const productId = parsedJson.productId || PRODUCT_ID;
    const email = parsedJson.email || EMAIL || null;
    const firstName = parsedJson.firstName || FIRSTNAME || null;
    const lastName = parsedJson.lastName || LASTNAME || null;
    const subscriptionId = parsedJson.subscriptionId || null;

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required purchase details"
      });
    }

    const licenseKey = generateLicenseKey();
    const queryParams = new URLSearchParams({
      purchaseId: String(purchaseId)
    });

    if (productId) {
      queryParams.set("productId", String(productId));
    }

    const redirectUrl = `${DASHBOARD_URL}/billing/success?${queryParams.toString()}`;

    // Log minimal transaction details for operational visibility.
    console.log("License generated", {
      receivedBody: req.body,
      purchaseId,
      productId,
      email,
      firstName,
      lastName,
      subscriptionId
    });

    return res.status(200).json({
      success: true,
      licenseKey,
      redirectUrl,
      receivedData: req.body,
      parsedData: {
        purchaseId,
        productId,
        email,
        firstName,
        lastName,
        subscriptionId
      }
    });
  } catch (error) {
    console.error("License generation failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "License generation failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Cleverbridge keygen backend running on port ${PORT}`);
});
