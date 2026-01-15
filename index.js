module.exports.wkpLogin = async (req, res, db, authProvider) => {
  try {
    const { pin } = req.body;
    const { WkpConfig } = authProvider;

    const token = await getWkpToken({
      WkpConfig,
    });

    const userData = await wkpUserDetails({
      WkpConfig,
      pin,
      token,
      db,
      req,
      authProvider,
    });

    if (!userData) {
      log.error("user not found");
      return setErrorResponse(null, ERROR.USER_NOT_FOUND, res, req);
    }
    return await getHashId(req, res, db, authProvider, userData);
  } catch (err) {
    log.error("wkpLogin catch err.........", err);
    const errorMsg =
    typeof err === "string"
      ? err
      : err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));

    await sendAuditLogs(db, req, err, {
      loginType: "WkpLogin",
      errorCode: errorMsg,
      customerId: authProvider?.CustomerID,
    });
    return setErrorResponseByServer(err, res, req);
  }
};
