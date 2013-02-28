// http://stackoverflow.com/questions/13371324/meteor-session-and-browser-refreshes
SessionAmplify = _.extend({}, Session, {
	keys: _.object(_.map(amplify.store(), function(value, key) {
		return [key, JSON.stringify(value)]
	})),
	set: function (key, value) {
		Session.set.apply(this, arguments);
		amplify.store(key, value);
	}
});

function isDraftRunning()
{
	return SessionAmplify.equals('isDraftRunning', true);
}

function isDraftPaused()
{
	return SessionAmplify.equals('isDraftPaused', true);
}

function isUserTurn(userId)
{
	return SessionAmplify.equals('draftCurrentUser', userId);
}

function isSnake()
{
	return SessionAmplify.equals('cycleType', 1);
}

function isSequential()
{
	return SessionAmplify.equals('cycleType', 2);
}

function getDraftTime()
{
	return SessionAmplify.get('draftTime');
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
	if(!SessionAmplify.equals('selectedUserId', null)) {
		userId = SessionAmplify.get('selectedUserId');
	} else if(!SessionAmplify.equals('draftCurrentUser', null)) {
		userId = SessionAmplify.get('draftCurrentUser');
	}

	return userId
}

function getSelectedUsername()
{
	var userId = getSelectedUserId(),
			user;
	if (userId == null) return "";
	user = Meteor.users.findOne({_id: userId});
	if (user == null) { return ""; }
	return user.username;
}
