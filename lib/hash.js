const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(":")) return false;
  const [salt, hash] = storedValue.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

const SESSION_SECRET = process.env.SESSION_SECRET || "some-default-secret-key-123456";

function signValue(value) {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(String(value));
  return `${value}.${hmac.digest("hex")}`;
}

function verifySignedValue(signedValue) {
  if (!signedValue || !signedValue.includes(".")) return null;
  const [value, sig] = signedValue.split(".");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(String(value));
  const expectedSig = hmac.digest("hex");
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return value;
    }
  } catch (e) {}
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signValue,
  verifySignedValue
};
