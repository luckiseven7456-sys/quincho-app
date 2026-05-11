```javascript
const express = require("express");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

const serviceAccount = require("/etc/secrets/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const payment = new mercadopago.Payment(client);

app.post("/webhook", async (req, res) => {

  try {

    console.log("Webhook recibido:", req.body);

    const paymentId = req.body?.data?.id || req.body?.resource;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    try {

      const data = await payment.get({ id: Number(paymentId) });

      await admin.firestore().collection("comprobantes").add({
        nombre: data.payer?.first_name || "Cliente",
        monto: data.transaction_amount || 0,
        estado: "confirmado",
        tipo: "mercadopago",
        payment_id: data.id,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (mpError) {

      console.log("Pago detectado sin metadata completa");

      await admin.firestore().collection("comprobantes").add({
        nombre: "Pago detectado",
        monto: 0,
        estado: "pendiente",
        tipo: "ipn_transferencia",
        payment_id: paymentId,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

    }

    res.sendStatus(200);

  } catch (error) {

    console.error(error);
    res.sendStatus(500);

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor iniciado");
});
```
