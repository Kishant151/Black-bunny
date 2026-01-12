const crypto = require('crypto')
const { EGHL_PAGE_TIMEOUT } = '780'
const { basePath } = 'http://localhost:4000/public'
const { decryptText } = require('../../helpers/encryptDecrypt')

const getHashKey = (argsData, encryptedData) => {
  const { CurrencyCode, Amount, ReturnURL, ApprovalURL, UnApprovalURL } = argsData
  const { ServiceId, Password } = encryptedData.eGHL

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

  const hashKey = `${serviceID}${paymentID}${merchantReturnURL}${merchantApprovalURL}${merchantUnApprovalURL}${merchantCallBackURL}${amount}${currencyCode}${custIP}${pageTimeout}${cardNo}${token}${recurringCriteria}`
  return {
    hashKey,
    Password,
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

const getHash = async (hashKey, password) => {
  let hash = crypto.createHash('sha256')
  const decryptedPassword = await decryptText(password)
  hashKey = `${decryptedPassword}${hashKey}`
  data = hash.update(hashKey, 'utf8')
  let hashValue = data.digest('hex')
  return hashValue
}

const generateEghlHash = (argsData, encryptedData) => {
  const eghlData = getHashKey(argsData, encryptedData)
  const hash = getHash(eghlData.hashKey, eghlData.Password)
  return { hash, eghlData }
}

module.exports = generateEghlHash





