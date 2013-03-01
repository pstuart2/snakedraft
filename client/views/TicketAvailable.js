Meteor.subscribe("users");
Meteor.subscribe("Tickets");
Meteor.subscribe("Configs");

Template.TicketAvailable.Users = function() {
	return Meteor.users.find({});
};

Template.TicketAvailable.isAdmin = function() {
	return imaAdmin();
};

Template.TicketAvailable.selectedUsername = function() {
	return getSelectedUsername();
};

Template.TicketAvailable.canAssign = function() {
	return getSelectedUserId() != null && (imaAdmin() ||  (!Meteor.userId() && SessionAmplify.equals("allowViewerControl", true)));
};

Template.TicketAvailable.helpers({
	/**
	 *
	 * @param items
	 * @return {String}
	 * @constructor
	 */
	Recommends: function (items) {
		if (!items || items.length == 0) {
			return '<div class="recommends"><span class="muted">No recommendations</span></div>';
		}

		var sortedList = _.sortBy(items, function(item) { return -item.by.length; }),
				output = "",
				title;

		_.each(sortedList, function(item) {
			title = "";
			output += "<span";
			if (Meteor.user() != null && item.user == Meteor.user().username) {
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
Template.TicketAvailable.IsMyRecommendChecked = function(ticketId) {
	if (Meteor.user() == null) { return false; }

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

Template.TicketAvailable.IsMyTurn = function() {
	if (Meteor.user() == null) { return false; }
	return isUserTurn(Meteor.userId());
};

Template.TicketAvailable.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.TicketAvailable.canChooseHours = function (hours) {
	var cssClass = "label-inverse",
			user;

	if (Meteor.user() == null) { return cssClass; }

	user = Meteor.users.findOne({_id: Meteor.userId()});
	if (parseInt(hours) > user.profile.hoursLeft)
	{
		cssClass = "label-important";
	}

	return cssClass;
};

Template.TicketAvailable.JiraLinkUrl = function() {
	return Configs.findOne({Name: "JiraLinkUrl"}).Value;
};

Template.TicketAvailable.canChoose = function (hours) {
	if (Meteor.user() == null) { return false; }

	if(isDraftRunning() && isUserTurn(Meteor.userId()))
	{
		var user = Meteor.users.findOne({_id: Meteor.userId()});
		return (parseInt(hours) <= user.profile.hoursLeft);
	}
	return false;
};

Template.TicketAvailable.events = {
	"click button.take-ticket": function(e) {
		e.preventDefault();

		var ticketId = this.Id;
		Meteor.call("takeTicket", Meteor.userId(), this._id, function(e, d){
			if (e) {
				alertify.error(e.reason);
			} else {
				alertify.success("You were assigned ticket " + ticketId);
			}
		});
	},
	"click button.assign-ticket": function(e) {
		var ticketId = this.Id;
		Meteor.call("assignTicket", getSelectedUserId(), this._id, function(e, d) {
			if (e) {
				alertify.error(e.reason);
			} else {
				alertify.success("Ticket " + ticketId + " was assigned.");
			}
		});
	},
	"change input.sug-checkbox": function(e) {
		var cb = $(e.currentTarget);
		Meteor.call("toggleRecTicket", Meteor.userId(), cb.val(), cb.data("ticket-id"), cb.is(":checked"));
	},
	"click button.delete-ticket": function() {
		deleteTicket(this._id);
	},
	"click button.edit-ticket": function() {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()});

		if (!currentUser.profile.isAdmin) {
			return;
		}

		Template.CustomTicket.Show(this._id);
	}
};
