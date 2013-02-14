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

Template.Tickets.isAdmin = function() {
	return Meteor.user().profile.isAdmin;
};

Template.Tickets.selectedUsername = function() {
	return Session.get("selectedUserName");
}

Template.Tickets.canAssign = function() {
	return !Session.equals('selectedUserId', null) && Meteor.user().profile.isAdmin;
};

Template.Tickets.helpers({
	/**
	 *
	 * @param items
	 * @return {String}
	 * @constructor
	 */
	Recommends: function (items) {
		if (!items || items.length == 0) {
			return '<div class="recommends"><span class="muted">Not recommended</span></div>';
		}

		var sortedList = _.sortBy(items, function(item) { return item.user; }),
				output = "",
				title;

		_.each(sortedList, function(item) {
			title = "";
			output += "<span";
			if (item.user == Meteor.user().username) {
				output += ' class="is-me"';
			}
			_.each(item.by, function(byUser) {
				if (title.length > 0) { title += ","; }
				title += byUser.username;
			});

			output += ' title="By: ' + title + '">';
			output += item.user + "(" + item.by.length + ")</span>&nbsp;";
		});

		return '<div class="recommends">' + output + "</div>";
	}
});

/**
 * @param ticketId
 * @return {String}
 * @constructor
 */
Template.Tickets.IsMyRecommendChecked = function(ticketId) {
	var ticket = Tickets.findOne({_id: ticketId}),
			thisUser = this.username,
			userRec = _.find(ticket.recommends, function(rec) { return rec.user == thisUser; }),
			retstring = "",
			myuser;

	if (userRec) {
		myuser = _.find(userRec.by, function(recBy) { return recBy.username == Meteor.user().username; });
		if (myuser) {

			retstring = 'checked="checked"';
		}
	}

	return retstring;
};

Template.Tickets.IsMyTurn = function() {
	return isUserTurn(Meteor.userId());
}

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
	"click button.assign-ticket": function(e) {
		Meteor.call("assignTicket", Session.get('selectedUserId'), this._id);
	},
	"click button.unassign-ticket": function(e) {
		Meteor.call("unassignTicket", this._id);
	},
	"change input.sug-checkbox": function(e) {
		var cb = $(e.currentTarget);
		Meteor.call("toggleRecTicket", Meteor.userId(), cb.val(), cb.data("ticket-id"), cb.is(":checked"));
	}
};
