function isDraftRunning()
{
	return Session.equals('isDraftRunning', true);
}

function isDraftPaused()
{
	return Session.equals('isDraftPaused', true);
}

function isUserTurn(userId)
{
	return Session.equals('draftCurrentUser', userId);
}

function isSnake()
{
	return Session.equals('cycleType', 1);
}

function isSequential()
{
	return Session.equals('cycleType', 2);
}

function getDraftTime()
{
	return Session.get('draftTime');
}
