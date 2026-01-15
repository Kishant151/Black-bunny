module.exports.handleWkpLogin = async (req, res, db, authProvider) => {
  try {
    const { pin: userPin } = req.body;
    const { WkpConfig: wkpConfig } = authProvider;

    const accessToken = await fetchWkpAccessToken({ wkpConfig });

    const userProfile = await fetchWkpUserProfile({
      wkpConfig,
      userPin,
      accessToken,
      db,
      req,
      authProvider,
    });

    if (!userProfile) {
      log.error("WKP user not found");
      return setErrorResponse(null, ERROR.USER_NOT_FOUND, res, req);
    }

    return await generateLoginHash(req, res, db, authProvider, userProfile);
  } catch (error) {
    log.error("handleWkpLogin error:", error);

    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message ||
          (typeof error === "object" ? JSON.stringify(error) : String(error));

    await sendAuditLogs(db, req, error, {
      loginType: "WkpLogin",
      errorCode: errorMessage,
      customerId: authProvider?.CustomerID,
    });

    return setErrorResponseByServer(error, res, req);
  }
};

/* ------------------------------------------------------------------ */
/* Fetch WKP Access Token */
/* ------------------------------------------------------------------ */

const fetchWkpAccessToken = async ({ wkpConfig }) => {
  try {
    const {
      ClientId: clientId,
      ClientSecret: clientSecret,
      TokenEndpoint: tokenEndpoint,
      OcpApimSubscriptionKey: subscriptionKey,
      Scope: rawScope,
    } = wkpConfig;

    const normalizedScope = rawScope
      ?.replaceAll(",", " ")
      ?.replace(/\s+/g, " ")
      ?.trim();

    const scopeSet = new Set(normalizedScope ? normalizedScope.split(" ") : []);

    const requestHeaders = {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    };

    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
    };

    if (scopeSet.size) {
      requestBody.scope = [...scopeSet].join(" ");
    }

    const response = await axios.post(tokenEndpoint, requestBody, {
      headers: requestHeaders,
    });

    if (response?.data?.token) {
      return response.data.token;
    }

    throw new Error("Invalid token response from WKP");
  } catch (error) {
    log.error(
      "fetchWkpAccessToken error:",
      error?.response?.data || error
    );
    log.error(
      "fetchWkpAccessToken status:",
      error?.response?.status
    );

    let formattedError;
    if (error?.response?.data) {
      formattedError = formatErrors(error.response.data);
    }

    throw formattedError || ErrorConstant.INVALID_PROVIDER_CONFIG;
  }
};

/* ------------------------------------------------------------------ */
/* Fetch WKP User Profile */
/* ------------------------------------------------------------------ */

const fetchWkpUserProfile = async ({ wkpConfig, userPin, accessToken }) => {
  try {
    const { WkpAuthEndpoint: authEndpoint } = wkpConfig;
    const requestUrl = `${authEndpoint}/${userPin}`;

    const response = await axios.get(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response?.data;
  } catch (error) {
    log.error(
      "fetchWkpUserProfile error:",
      error?.response?.data || error
    );
    log.error(
      "fetchWkpUserProfile status:",
      error?.response?.status
    );

    let formattedError;

    if (error?.response?.data?.error?.details) {
      formattedError = formatErrors(error.response.data.error.details);
    } else if (error?.response?.data) {
      formattedError = formatErrors(error.response.data);
    }

    throw formattedError || ErrorConstant.INVALID_LOGIN_CREDENTIALS;
  }
};
