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

Configs = new Meteor.Collection("Configs");
Tickets = new Meteor.Collection("Tickets");
Drafts = new Meteor.Collection("Drafts");
Messages = new Meteor.Collection("Messages");
UserMessages = new Meteor.Collection("UserMessage");

Meteor.subscribe("users");
Meteor.subscribe("Tickets");
Meteor.subscribe("Configs");
Meteor.subscribe("Drafts");
Meteor.subscribe("Messages");
Meteor.subscribe("UserMessages");

isDraftRunning = function ()
{
	return SessionAmplify.equals('isDraftRunning', true);
}

isDraftPaused = function ()
{
	return SessionAmplify.equals('isDraftPaused', true);
}

isUserTurn = function (userId)
{
	return SessionAmplify.equals('draftCurrentUser', userId);
}

isSnake = function ()
{
	return SessionAmplify.equals('cycleType', 1);
}

isSequential = function ()
{
	return SessionAmplify.equals('cycleType', 2);
}

getDraftTime = function ()
{
	return SessionAmplify.get('draftTime');
}

deleteTicket = function (ticketId)
{
	if (confirm("Are you sure you want to delete this ticket?")) {
		Tickets.remove({_id: ticketId});

		Meteor.call("calculateUserHoursTicketHours", function(e, d) {
			if (e) {
				alertify.error(e.reason);
			}
		});
	}
}

imaAdmin = function ()
{
	return Meteor.user() != null && Meteor.user().profile.isAdmin;
}

getSelectedUserId = function ()
{
	var userId = null;
	if(!SessionAmplify.equals('selectedUserId', null)) {
		userId = SessionAmplify.get('selectedUserId');
	} else if(!SessionAmplify.equals('draftCurrentUser', null)) {
		userId = SessionAmplify.get('draftCurrentUser');
	}

	return userId
}

getSelectedUsername = function ()
{
	var userId = getSelectedUserId(),
			user;
	if (userId == null) return "";
	user = Meteor.users.findOne({_id: userId});
	if (user == null) { return ""; }
	return user.username;
}
