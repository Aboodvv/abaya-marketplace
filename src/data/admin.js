const admin = require("firebase-admin");
const serviceAccount = require("./abaya-marketplace-firebase-adminsdk-fbsvc-206eb1b7a1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ضع UID الخاص بك هنا
const uid = "SS6Xip7MDrVAmiWUNMVyebprbi53";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Admin added successfully");
    process.exit();
  })
  .catch(console.error);
