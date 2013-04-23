Template.MainDiv.rendered = function() {
	console.log(document.body.clientHeight);
};

Template.MainDiv.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(Meteor.userId())) {
		return SessionAmplify.get("draftTimeBack");
	}

	return "";
};

