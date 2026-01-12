const crypto = require('crypto')
const { EGHL_PAGE_TIMEOUT } = '780'
const { basePath } = 'http://localhost:4000/public'

/**
 * Prepare data required for eGHL hash generation
 */
const getHashKeyData = (argsData, encryptedData) => {
  const { CurrencyCode, Amount, ReturnURL, ApprovalURL, UnApprovalURL } = argsData
  const { ServiceId, Password: merchantSecret } = encryptedData.eGHL

  const orderNumber = crypto.randomBytes(32).toString('hex').slice(0, 20)

  const paymentID = crypto
    .randomBytes(32)
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
   * NOTE:
   * This string follows eGHL signature specification.
   * It is NOT a user password hash.
   */
  const hashPayload = `${merchantSecret}${ServiceId}${paymentID}${merchantReturnURL}${merchantApprovalURL}${merchantUnApprovalURL}${merchantCallBackURL}${amount}${currencyCode}${custIP}${pageTimeout}${cardNo}${token}${recurringCriteria}`

  return {
    merchantSecret,
    hashPayload,
    orderNumber,
    paymentID,
    pageTimeout,
    amount,
    merchantCallBackURL,
    merchantReturnURL,
    merchantApprovalURL,
    merchantUnApprovalURL
  }
}

/**
 * Secure HMAC-based hash generation (payment gateway safe)
 */
const generateHash = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
}

/**
 * Main function to generate eGHL hash
 */
const generateEghlHash = (argsData, encryptedData) => {
  const eghlData = getHashKeyData(argsData, encryptedData)

  const hash = generateHash(
    eghlData.hashPayload,
    eghlData.merchantSecret
  )

  // Remove secret before returning
  delete eghlData.merchantSecret
  delete eghlData.hashPayload

  return {
    hash,
    eghlData
  }
}

module.exports = generateEghlHash
