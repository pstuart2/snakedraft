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

function imaAdmin()
{
	return Meteor.user() != null && Meteor.user().profile.isAdmin;
}

function getSelectedUserId()
{
	var userId = null;
	if(!Session.equals('selectedUserId', null)) {
		userId = Session.get('selectedUserId');
	} else if(!Session.equals('draftCurrentUser', null)) {
		userId = Session.get('draftCurrentUser');
	}

	return userId
}

function getSelectedUsername()
{
	var userId = getSelectedUserId();
	if (userId == null) return "";
	return Meteor.users.findOne({_id: userId}).username;
}
