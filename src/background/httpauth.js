var httpAuth = httpAuth || {};

httpAuth.requests = [];

httpAuth.requestCompleted = function (details) {
	var idx = httpAuth.requests.indexOf(details.requestId);
	if (idx >= 0) {
		httpAuth.requests.splice(idx, 1);
	}
}

httpAuth.handleRequestPromise = function (details) {
	return new Promise((resolve, reject) => {
		httpAuth.processPendingCallbacks(details, resolve, reject);
	});
}

httpAuth.handleRequestCallback = function (details, callback) {
	httpAuth.processPendingCallbacks(details, callback, callback);
}

httpAuth.processPendingCallbacks = function (details, resolve, reject) {

	if (httpAuth.requests.indexOf(details.requestId) >= 0 || !page.tabs[details.tabId]) {
		reject({});
		return;
	}

	httpAuth.requests.push(details.requestId);

	if (details.challenger) {
		details.proxyUrl = details.challenger.host;
	}

	details.searchUrl = (details.isProxy && details.proxyUrl) ? details.proxyUrl : details.url;

	keepass.retrieveCredentials((logins) => {
		httpAuth.loginOrShowCredentials(logins, details, resolve, reject);
	}, { "id": details.tabId }, details.searchUrl, details.searchUrl, true);
}

httpAuth.loginOrShowCredentials = function (logins, details, resolve, reject) {
	// at least one login found --> use first to login
	if (logins.length > 0) {
		if (logins.length == 1 && page.settings.autoFillAndSend) {
			resolve({
				authCredentials: {
					username: logins[0].Login,
					password: logins[0].Password
				}
			});
		} else {
			cipevent.onHTTPAuthPopup(null, { "id": details.tabId }, { "logins": logins, "url": details.searchUrl, 'resolve': resolve });
		}
	}
	// no logins found
	else {
		reject({});
	}
}
