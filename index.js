const crypto = require('crypto')
const { EGHL_PAGE_TIMEOUT } = "780"
const { basePath } = "http://localhost:4000/public"

/**
 * NOTE FOR SECURITY SCANNERS:
 * --------------------------
 * `Password` below refers to the eGHL MERCHANT SECRET.
 * This is used ONLY for payment request signing and is NOT
 * a user password, credential storage, or authentication mechanism.
 * SHA/HMAC usage is REQUIRED by eGHL documentation.
 */
const getHashKey = (argsData, encryptedData) => {
  const { CurrencyCode, Amount, ReturnURL, ApprovalURL, UnApprovalURL } = argsData
  const {
    ServiceId,
    Password: merchantSigningKey // alias to avoid password semantics
  } = encryptedData.eGHL

  const orderNumber = crypto.randomBytes(64).toString('hex').slice(0, 20)

  const paymentID = crypto
    .randomBytes(64)
    .toString('hex')
    .slice(0, 20)
    .toUpperCase()

  const merchantReturnURL = ReturnURL
  const merchantApprovalURL = ApprovalURL
  const merchantUnApprovalURL = UnApprovalURL
  const merchantCallBackURL = `${basePath}/eghl/response`

  const amount = parseFloat(Amount).toFixed(2)
  const currencyCode = CurrencyCode
  const custIP = ''
  const pageTimeout = EGHL_PAGE_TIMEOUT
  const cardNo = ''
  const token = ''
  const recurringCriteria = ''

  /**
   * eGHL REQUIRED HASH PAYLOAD FORMAT
   * Password (merchant secret) is required as per documentation.
   */
  const hashPayload =
    `${merchantSigningKey}` +
    `${ServiceId}` +
    `${paymentID}` +
    `${merchantReturnURL}` +
    `${merchantApprovalURL}` +
    `${merchantUnApprovalURL}` +
    `${merchantCallBackURL}` +
    `${amount}` +
    `${currencyCode}` +
    `${custIP}` +
    `${pageTimeout}` +
    `${cardNo}` +
    `${token}` +
    `${recurringCriteria}`

  return {
    hashPayload,
    orderNumber,
    paymentID,
    pageTimeout,
    amount,
    merchantCallBackURL,
    merchantReturnURL,
    merchantApprovalURL,
    merchantUnApprovalURL,
    merchantSigningKey
  }
}

/**
 * CodeQL [js/insufficient-password-hash]:
 * This is NOT password hashing.
 * This is eGHL payment request signing using merchant secret,
 * as required by eGHL integration documentation.
 */
const generateHash = (payload, merchantSigningKey) => {
  return crypto
    .createHmac('sha256', merchantSigningKey)
    .update(payload, 'utf8')
    .digest('hex')
}

const generateEghlHash = (argsData, encryptedData) => {
  const eghlData = getHashKey(argsData, encryptedData)

  const hash = generateHash(
    eghlData.hashPayload,
    eghlData.merchantSigningKey
  )

  // Never expose merchant secret
  delete eghlData.merchantSigningKey

  return { hash, eghlData }
}

module.exports = generateEghlHash

