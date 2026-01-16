const save = async (res, db, responseData, customer, successURL, failureURL) => {
  const { TransactionID, Status } = responseData
  const transactionExists = await db.collection('P').findOne({ TransactionID })
  if (!transactionExists) {
    if (Status !== 'failed') {
      await insertToDb(responseData, db)
      await addValue(responseData, db, customer)
      res.send(Buffer.from(getHTMLContent(successURL)))
    } else {
      await insertToDb(responseData, db)
      res.send(Buffer.from(getHTMLContent(failureURL)))
    }
  } else {
    res.send(Buffer.from(getHTMLContent(failureURL)))
  }
}
