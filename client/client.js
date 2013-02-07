function isDraftRunning() {
	return Session.equals('isDraftRunning', true);
}

function isDraftPaused() {
	return Session.equals('isDraftPaused', true);
}
