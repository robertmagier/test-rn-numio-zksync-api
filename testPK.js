var crypto = require("crypto");
var eccrypto = require("eccrypto");


console.log(Buffer)
// A new random 32-byte private key.
var privateKey = eccrypto.generatePrivate();
console.log(eccrypto)
console.log(Buffer.from(privateKey))
console.log(privateKey.toString())
console.log('0x'+privateKey.toString('hex'))
// Corresponding uncompressed (65-byte) public key.
var publicKey = eccrypto.getPublic(privateKey);

var str = "message to sign";
// Always hash you message to sign!
var msg = crypto.createHash("sha256").update(str).digest();

eccrypto.sign(privateKey, msg).then(function(sig) {
  console.log("Signature in DER format:", sig);
  eccrypto.verify(publicKey, msg, sig).then(function() {
    console.log("Signature is OK");
  }).catch(function() {
    console.log("Signature is BAD");
  });
});
