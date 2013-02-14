Template.MainDiv.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(Meteor.userId())) {
		var wclass = "",
				time = getDraftTime();

		if (isDraftRunning() && !isDraftPaused()) {
			if (time > 20) { wclass = "success-back"; }
			else if (time <= 10) { wclass = "danger-back"; }
			else {
				wclass = "warning-back";
			}
		}

		return wclass;
	}

	return "";
};

