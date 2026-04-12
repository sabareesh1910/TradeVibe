const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: "tradevibe-44c08",
  private_key_id: "40f024e24d776137137c51059dd7ca024560f664",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCs9xrwsSu8KmsU\nyHVxjOaVKfd2Om8tcCR3pcO1rGV5eXcZSxbDPbQ2vMmURIJD3WP/Jxj2ytQ0eSpS\nPVZSjBOpDxUwaA48iHRVx8S3wBcgRtwcEBTHZ2XbgR7AutNedNDg15jZ0erhC4rz\nhaHeASSDTDEwYu/iVxXB6DltB8XXmjvW9JM2pWRuIdMpRBdl5fS3uGBodQh92q56\n5sRcfQ1tNL+sMXdwueCpR4rwU+ZgKlG92HibLK9xYUBX2dXj2923DxKKhy5xdhSv\nA/VC31tnz+VQa4t8qz7MBTL5Snef3/0+VYJEsb5krGso3/2cAUUI9Hd3/xScRRKj\nrlFCX71LAgMBAAECggEAEJPvX7BrgH53gvQ8cj5OzDv+47Sk4UlruJGi8qLsAVRh\nOoOWHyJz4M2Za7EuFxkW5rOCbG0MuvbK1dUN+zcONb7w75HM0FDeOmm9ct5hzEGR\nnGYolHzv9Oj139BIRmssQtCg1G4odM3P0WVps61b9YwNwhVJgeHwGOsltEu+OUEy\nLMui0NHbUrlgXFBQSS0RHREra/rV2l6o5mKJr8W8LwJxWV5Ygb+rtAJP9PV4pPYg\nahbv+OWLJEx1rD4Bm/hMr9wxMErjqSZ0gCNnVkCH/sC5Q2woRdeSMPSX8OQ4JyU5\nOI9uT8oZBTrc5gmxwG6ynuqjVGA5ukOZojtbsrH0mQKBgQDZsRCSalhyfF6b7b7R\nu+mPeiC8DxG2UHHR0a8DoCL+wnHvnbF3OfLNX8QkFFo+aKv8mff4dkx+ABGtgMoN\nRIaNE+9+0z5XHPk2S3BBX7NCTMAgWYX5VRqu58WzPbHbWuJ7gOJ6GUu2kLXrCvBr\nHWpgM3RzXYIWCuksTrn01cantwKBgQDLZyGVdneRuu0oWFLI1+UBp1149H3w5Pd2\nM1Pe/wCFEklQmztuXx47fjejoW7oqQpzOZn5pGcAc/4SidXcN+7J7Swiw29AMydF\nwLC3pIuDJ9RW5RX7+LPYu3w6fovgbhSmJK4mBqc6/KZH3t8XXA0p1xZNngHcRc9S\noBlxaTaPDQKBgQC9QvYXdaHkF0Dh7DckfW04MoPXPHq3uQTb2KOCUW1bdI4+Nymd\ncKIp8ALFI3S6IaK1gN9YAvHJ8iFsaTZBhrw8V4K3Ds16S1RX4gp8q8lb8QJwnaSe\n+2CxhAwcI51ICqIxogJFCU0MMpAXA3G2juJ3NQUfb8Kzi1TiEqgVtu55zQKBgDzb\n8b9/v8z5yiXtL2/qsRmqkxwyw1AFoklamDi7wdMPIqKcn86pZSlV3Z33GnFAyuCp\nFnoMh8kp65ZuaW/HyIngjfkk0q+53oFPY1C/SgMHMtCBIO/QfTdW+Zei74VKSqFf\njj/Qc88Bc1tDwyqBH2sqcQDuSw42UQ8e2h4F5g4tAoGAPW1NDh0xicON8xLd9JEn\nqhN3auAMlZDLDJGvIgQyN7nxRXxks2R80ek1D145fbm3z+xrNiAayIz84k43OBP3\nrMXyrTr2OQQ+zP10VLgyjRcqunPTwMiDKPPXERAusG6SlR7+vcaDiMJJfvirVYPV\nryiKaYBXWL0b3hqIVxP14Vc=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@tradevibe-44c08.iam.gserviceaccount.com",
  client_id: "105520126743269718530",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tradevibe-44c08.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "tradevibe-44c08"
});

const db = admin.firestore();
const messaging = admin.messaging();

function parseAlert(body) {
  let ticker = "UNKNOWN", action = "ALERT", price = 0,
      message = "", interval = "", exchange = "";

  if (typeof body === "object" && body !== null) {
    ticker   = String(body.ticker   || body.symbol || "UNKNOWN").toUpperCase();
    action   = String(body.action   || body.side   || "ALERT").toUpperCase();
    price    = parseFloat(body.price || body.close || 0);
    message  = String(body.message  || body.comment || "");
    interval = String(body.interval || "");
    exchange = String(body.exchange || "");
  } else if (typeof body === "string") {
    const tickerMatch  = body.match(/([A-Z]{2,10}USDT?|NIFTY\w*|BANK\w*|[A-Z]{2,6})/i);
    const actionMatch  = body.match(/\b(BUY|SELL|LONG|SHORT)\b/i);
    const priceMatch   = body.match(/(?:at|@|price:?)\s*([\d,.]+)/i);
    ticker  = tickerMatch  ? tickerMatch[1].toUpperCase()  : "UNKNOWN";
    action  = actionMatch  ? actionMatch[1].toUpperCase()  : "ALERT";
    price   = priceMatch   ? parseFloat(priceMatch[1].replace(/,/g,"")) : 0;
    message = body;
  }

  if (action === "LONG")  action = "BUY";
  if (action === "SHORT") action = "SELL";
  const priority = (action === "BUY" || action === "SELL") ? "HIGH" : "NORMAL";

  return { ticker, action, price, message, interval, exchange, priority };
}

exports.alertWebhook = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const secret = req.query.secret || req.body.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET || "tradevibe2024";
    if (secret !== expectedSecret) {
      console.warn("Unauthorized webhook attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (_) {}
      }

      const parsed = parseAlert(body);
      console.log("Alert parsed:", parsed);

      const alertRef = await db.collection("alerts").add({
        ...parsed,
        price: parsed.price,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        acknowledged: false,
        lastWebhookAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.doc("status/webhook").set({
        lastPing: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
        lastTicker: parsed.ticker,
        lastAction: parsed.action
      }, { merge: true });

      const tokensSnap = await db.collection("tokens").get();
      if (tokensSnap.empty) {
        console.log("No tokens registered");
        return res.json({ success: true, alertId: alertRef.id, sent: 0 });
      }

      const tokens = [];
      const tokenDocs = {};
      tokensSnap.forEach(doc => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
          tokenDocs[data.token] = doc.id;
        }
      });

      const fcmPayload = {
        tokens,
        data: {
          alertId:   alertRef.id,
          ticker:    parsed.ticker,
          action:    parsed.action,
          price:     String(parsed.price),
          message:   parsed.message,
          priority:  parsed.priority,
          interval:  parsed.interval,
          exchange:  parsed.exchange,
          timestamp: String(Date.now())
        },
        android: {
          priority: "high",
          ttl: 60000
        }
      };

      const response = await messaging.sendEachForMulticast(fcmPayload);
      console.log(`FCM sent: ${response.successCount} success, ${response.failureCount} failed`);

      const batch = db.batch();
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error && r.error.code;
          if (code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token") {
            const docId = tokenDocs[tokens[i]];
            if (docId) batch.delete(db.collection("tokens").doc(docId));
          }
        }
      });
      await batch.commit();

      return res.json({
        success: true,
        alertId: alertRef.id,
        sent: response.successCount,
        failed: response.failureCount
      });

    } catch (err) {
      console.error("alertWebhook error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

exports.registerToken = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { token, platform, deviceId } = req.body;
    if (!token || !deviceId) return res.status(400).json({ error: "token and deviceId required" });

    try {
      await db.collection("tokens").doc(deviceId).set({
        token,
        platform: platform || "android",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.doc("status/fcm").set({
        registered: true,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        deviceId
      }, { merge: true });

      console.log("Token registered for device:", deviceId);
      return res.json({ success: true });
    } catch (err) {
      console.error("registerToken error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

exports.getStatus = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    try {
      const [webhookDoc, fcmDoc, alertsSnap] = await Promise.all([
        db.doc("status/webhook").get(),
        db.doc("status/fcm").get(),
        db.collection("alerts")
          .where("receivedAt", ">=", new Date(Date.now() - 86400000))
          .count().get()
      ]);

      const webhook = webhookDoc.exists ? webhookDoc.data() : {};
      const fcm     = fcmDoc.exists     ? fcmDoc.data()     : {};

      return res.json({
        webhook: {
          status:    webhook.status || "unknown",
          lastPing:  webhook.lastPing ? webhook.lastPing.toDate().toISOString() : null,
          lastTicker: webhook.lastTicker || null
        },
        fcm: {
          registered: fcm.registered || false,
          lastSeen:   fcm.lastSeen ? fcm.lastSeen.toDate().toISOString() : null
        },
        alertsToday: alertsSnap.data().count,
        serverTime:  new Date().toISOString()
      });
    } catch (err) {
      console.error("getStatus error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);
