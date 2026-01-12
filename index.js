module.exports = {
  Query: {
    async getAtriumBalance (_, {customerId, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint }, context) {
      log.lambdaSetup(context, 'authProviders', 'getAtriumBalance')
      try {
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

const atriumAuthToken = async (region) => {
    try {
        const secretName = `${config.Stage}/${config.domainName}/atrium`;
        const client = new SecretsManagerClient({ region });
        const params = { SecretId: secretName };
        const command = new GetSecretValueCommand(params);
        const response = await client.send(command);
        if ("SecretString" in response) {
            return JSON.parse(response.SecretString);
        }
        throw new Error("SecretString not found in response");
    } catch (e) {
        log.error(e);
        throw e;
    }
};

const getDatabaseOneCustomer = async (context, customerId) => {
  let db = await getDb()
  const customerData = customerId ? await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 }) : null
  if (customerData && customerData.Tier !== STANDARD_TIER) {
    db = await isolatedDatabase(customerData.DomainName)
  }
  return db
}

const getDatabase = async (context) => {
  return await getDb()
}
const atriumGetToken = async (authData, atriumEndpoint) => {
    try {
        const reqData = {
            "oauth": {
                "client_id": authData.clientId,
                "client_secret_key": authData.secretKey
            }
        }
        const { data } = await axios.post(`${ATRIUM_GET_TOKEN}`, reqData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('data*****',data);
        return data?.access_token
    } catch (error) {
        log.error(error);
        throw new Error(error)
    }
}

const atriumGetBalance = async (token, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint) => {
    try {
        const requestBody = {
            "version": 1,
            "key": token,
            "type": "inquiry",
            "customer": {
                "type": "card",
                "number": cardNumber
            },
            "account": {
                "mode": accountMode,
                "number": accountNumber
            },
            "origin": {
                "type": "terminal",
                "id": terminalId
            },
            "time": {
                "state": "offline",
                "timezone": "local"
            }
        }
        const response = await axios.post(`${atriumEndpoint}${ATRIUM_ENDPOINT}`, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data
    } catch (error) {
        log.error(error);
        throw new Error(error)
    }
};
