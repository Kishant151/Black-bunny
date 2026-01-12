module.exports = {
  Query: {
    async getAtriumBalance (_, {customerId, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint }, context) {
      log.lambdaSetup(context, 'authProviders', 'getAtriumBalance')
      try {
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        const authData = await atriumAuthToken(config.region)
        const token = await atriumGetToken(authData, atriumEndpoint)
        console.log('authData', authData)
        const getBalance = await atriumGetBalance(token, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint)
        if (getBalance?.message?.toLowerCase() === 'approved'){
          return {
            Message: getBalance.message,
            StatusCode: 200,
            TransactionID: getBalance.txid,
            RemainingAmount: getBalance?.amount?.remaining,
            Currency: getBalance?.amount?.currency
          }
        } else {
            log.info('transaction failed')
            return {
              Message: 'Failed to retrieve balance',
              StatusCode: 400
          }
        }
      } catch (err) {
        log.error(err)
        throw new Error(err.message)
      }
    },
  }
}
