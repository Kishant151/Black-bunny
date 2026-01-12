const crypto = require('crypto')
const EGHL_PAGE_TIMEOUT = '780'
const basePath = 'http://localhost:4000/public'

const buildSignaturePayload = (inputParams, decryptedPayload) => {
  const {
    CurrencyCode: currencyCodeInput,
    Amount: amountInput,
    ReturnURL: returnUrlInput,
    ApprovalURL: approvalUrlInput,
    UnApprovalURL: unApprovalUrlInput
  } = inputParams

  const {
    ServiceId: serviceIdentifier,
    Password: secretKey
  } = decryptedPayload.eGHL

  const orderReference = crypto.randomBytes(64).toString('hex').slice(0, 20)

  const transactionIdentifier = crypto
    .randomBytes(64)
    .toString('hex')
    .slice(0, 20)
    .toUpperCase()

  const callbackUrl = `${basePath}/eghl/response`
  const formattedAmount = parseFloat(amountInput).toFixed(2)
  const timeout = EGHL_PAGE_TIMEOUT

  const customerIp = ''
  const cardNumber = ''
  const tokenValue = ''
  const recurringCondition = ''

  const signaturePayload =
    `${secretKey}` +
    `${serviceIdentifier}` +
    `${transactionIdentifier}` +
    `${returnUrlInput}` +
    `${approvalUrlInput}` +
    `${unApprovalUrlInput}` +
    `${callbackUrl}` +
    `${formattedAmount}` +
    `${currencyCodeInput}` +
    `${customerIp}` +
    `${timeout}` +
    `${cardNumber}` +
    `${tokenValue}` +
    `${recurringCondition}`

  return {
    signaturePayload,
    orderReference,
    paymentReference: transactionIdentifier,
    timeout,
    totalAmount: formattedAmount,
    callbackUrl,
    returnUrl: returnUrlInput,
    approvalUrl: approvalUrlInput,
    unApprovalUrl: unApprovalUrlInput
  }
}

const generateSha256Hash = (payload) => {
  const hashInstance = crypto.createHash('sha256')
  const updatedHash = hashInstance.update(payload, 'utf8')
  const hashResult = updatedHash.digest('hex')
  return hashResult
}

const createEghlHash = (inputParams, decryptedPayload) => {
  const paymentData = buildSignaturePayload(inputParams, decryptedPayload)
  const hashValue = generateSha256Hash(paymentData.signaturePayload)
  return { hash: hashValue, eghlData: paymentData }
}

module.exports = createEghlHash
