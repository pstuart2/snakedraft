Template.MainDiv.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(Meteor.userId())) {
		return "main-div-active";
	}

	return "";
};

