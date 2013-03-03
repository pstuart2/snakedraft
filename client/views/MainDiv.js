Template.MainDiv.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(Meteor.userId())) {
		return SessionAmplify.get("draftTimeBack");
	}

	return "";
};

