const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();

mercadopago.configure({
  access_token: "APP_USR-7003802c-f67b-430e-9714-2dbb8d8cbf3c"
});

exports.mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {

  try {

    console.log("Webhook recibido:", req.body);

    const paymentId = req.body.data.id;

    const payment = await mercadopago.payment.findById(paymentId);

    const data = payment.body;

    await admin.firestore().collection("comprobantes").add({
      nombre: data.payer?.first_name || "Cliente",
      monto: data.transaction_amount,
      estado: "confirmado",
      tipo: "mercadopago",
      payment_id: data.id,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.sendStatus(200);

  } catch (error) {

    console.error(error);
    res.sendStatus(500);

  }

});