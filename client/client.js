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

var Configs = new Meteor.Collection("Configs");
var Tickets = new Meteor.Collection("Tickets");
var Drafts = new Meteor.Collection("Drafts");
var Messages = new Meteor.Collection("Messages");
var UserMessages = new Meteor.Collection("UserMessage");

Meteor.subscribe("users");
Meteor.subscribe("Tickets");
Meteor.subscribe("Configs");
Meteor.subscribe("Drafts");
Meteor.subscribe("Messages");
Meteor.subscribe("UserMessages");


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
		Tickets.remove({_id: ticketId});

		Meteor.call("calculateUserHoursTicketHours", function(e, d) {
			if (e) {
				alertify.error(e.reason);
			}
		});
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
