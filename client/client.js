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

function deleteTicket(ticketId)
{
	if (confirm("Are you sure you want to delete this ticket?")) {
		Meteor.call("deleteTicket", ticketId);
	}
}
