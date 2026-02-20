const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ضع هنا UID الخاص بك
const uid = "SS6Xip7MDrVAmiWUNMVyebprbi53";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Admin added successfully");
    process.exit();
  })
  .catch(console.error);
