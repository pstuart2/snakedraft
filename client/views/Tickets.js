Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.Tickets.AvailableTicketArr = function() {
	return Tickets.find({AssignedUserId: {$exists: false}}, {sort: {Id: 1}});
};

Template.Tickets.MyTicketArr = function() {
	var selectedUserId = Session.get('selectedUserId');
	if(!selectedUserId) { selectedUserId = Meteor.userId(); }
	return Tickets.find({AssignedUserId: selectedUserId}, {sort: {Id: 1}});
};

Template.Tickets.Users = function() {
	return Meteor.users.find({});
};

Template.Tickets.Recommends = function() {
	return _.reject(this.recommends, function(rec) { return rec.by == Meteor.user().username; });
};

/**
 *
 * @param username
 * @return {*}
 * @constructor
 */
Template.Tickets.CheckMe = function(username) {
	if (username != Meteor.user().username) {
		return username;
	}

	return '<span class="is-me">' + username + '</span>';
};

/**
 * @param ticketId
 * @return {String}
 * @constructor
 */
Template.Tickets.IsMyRecommendChecked = function(ticketId) {
	var ticket = Tickets.findOne({_id: ticketId}),
			myrec = _.find(ticket.recommends, function(rec) { return rec.by == Meteor.user().username; }),
			curusername = this.username,
			retstring = "",
			myuser;

	if (myrec) {
		myuser = _.find(myrec.users, function(user) { return user.username == curusername; });
		if (myuser) {

			retstring = 'checked="checked"';
		}
	}

	return retstring;
};

Template.Tickets.userSelected = function() {
	return !Session.equals('selectedUserId', null);
};

Template.Tickets.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Tickets.canChooseHours = function (hours) {
	var cssClass = "label-inverse",
			user = Meteor.users.findOne({_id: Meteor.userId()});
	if (parseInt(hours) > user.profile.totalHoursAvailable)
	{
		cssClass = "label-important";
	}

	return cssClass;
};

Template.Tickets.canChoose = function (hours) {
	if(isDraftRunning() && isUserTurn(Meteor.userId()))
	{
		var user = Meteor.users.findOne({_id: Meteor.userId()});
		return (parseInt(hours) <= user.profile.totalHoursAvailable);
	}
	return false;
};

Template.Tickets.events = {
	"click button.take-ticket": function(e) {
		e.preventDefault();

		Meteor.call("takeTicket", Meteor.userId(), this._id);
	},
	"change input.sug-checkbox": function(e) {
		var cb = $(e.currentTarget);
		Meteor.call("toggleRecTicket", Meteor.userId(), cb.val(), cb.data("ticket-id"), cb.is(":checked"));
	}
};
