Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.Results.Users = function() {
	return Meteor.users.find({'profile.isScrumMaster': false}, {sort: {username: 1}});
};

Template.Results.UserTickets = function() {
	return Tickets.find({AssignedUserId: this._id}, {sort: {Id: 1}});
	//return Tickets.find({AssignedUserId: {$exists: true}}, {sort: {Id: 1}});
};

Template.Results.formatTotalHours = function(hours) {
	return formatTotalHours(hours);
};

Template.Results.events({

});
