const crypto = require('crypto')
const EGHL_PAGE_TIMEOUT = '780'
const basePath = 'http://localhost:4000/public'

const buildSignatureData = (inputData, decryptedData) => {
  const {
    CurrencyCode: inputCurrency,
    Amount: inputAmount,
    ReturnURL: returnUrl,
    ApprovalURL: approvalUrl,
    UnApprovalURL: rejectionUrl
  } = inputData

  const {
    ServiceId: serviceIdentifier,
    Password: secretKey
  } = decryptedData.eGHL

  const orderReference = crypto.randomBytes(64).toString('hex').slice(0, 20)
  const transactionReference = crypto
    .randomBytes(64)
    .toString('hex')
    .slice(0, 20)
    .toUpperCase()

  const callbackUrl = `${basePath}/eghl/response`
  const formattedAmount = parseFloat(inputAmount).toFixed(2)
  const timeout = EGHL_PAGE_TIMEOUT

  const customerIp = ''
  const cardNumber = ''
  const tokenValue = ''
  const recurringRule = ''

  const signaturePayload =
    `${secretKey}` +
    `${serviceIdentifier}` +
    `${transactionReference}` +
    `${returnUrl}` +
    `${approvalUrl}` +
    `${rejectionUrl}` +
    `${callbackUrl}` +
    `${formattedAmount}` +
    `${inputCurrency}` +
    `${customerIp}` +
    `${timeout}` +
    `${cardNumber}` +
    `${tokenValue}` +
    `${recurringRule}`

  return {
    signaturePayload,
    orderReference,
    transactionReference,
    timeout,
    totalAmount: formattedAmount,
    callbackUrl,
    returnUrl,
    approvalUrl,
    rejectionUrl,
    secretKey
  }
}

const computeHmacHash = (payload, secretKey) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(payload, 'utf8')
    .digest('hex')
}

const createEghlSignature = (inputData, decryptedData) => {
  const signatureData = buildSignatureData(inputData, decryptedData)
  const hashValue = computeHmacHash(
    signatureData.signaturePayload,
    signatureData.secretKey
  )

  delete signatureData.secretKey

  return { hash: hashValue, eghlData: signatureData }
}

module.exports = createEghlSignature

