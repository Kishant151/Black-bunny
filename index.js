const crypto = require('crypto')
const { EGHL_PAGE_TIMEOUT } = '780'
const { basePath } = 'http://localhost:4000/public'

const getHashKey = (argsData, encryptedData) => {
  const { CurrencyCode, Amount, ReturnURL, ApprovalURL, UnApprovalURL } = argsData
  const { ServiceId } = encryptedData.eGHL
  const merchantSecret = encryptedData.eGHL.Password

  const orderNumber = crypto.randomBytes(64).toString('hex').slice(0, 20)
  const serviceID = ServiceId
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

  const hashKey = `${merchantSecret}${serviceID}${paymentID}${merchantReturnURL}${merchantApprovalURL}${merchantUnApprovalURL}${merchantCallBackURL}${amount}${currencyCode}${custIP}${pageTimeout}${cardNo}${token}${recurringCriteria}`
  return {
    hashKey,
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

// const getHash = (hashKey) => {
//   let hash = crypto.createHash('sha256')
//   data = hash.update(hashKey, 'utf8')
//   let hashValue = data.digest('hex')
//   return hashValue
// }

const getHash = (payload, merchantSecret) => {
  /**
   * SECURITY NOTE:
   * This is payment gateway message signing, not password hashing.
   * HMAC-SHA256 is required by eGHL and is secure in this context.
   */
  return crypto
    .createHmac('sha256', merchantSecret)
    .update(payload, 'utf8')
    .digest('hex')
}

const generateEghlHash = (argsData, encryptedData) => {
  const eghlData = getHashKey(argsData, encryptedData)
  const hash = getHash(eghlData.hashKey)
  return { hash, eghlData }
}

module.exports = generateEghlHash



