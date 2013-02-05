Meteor.subscribe("DraftTimer");

Template.CommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.CommandBar.isDraftRunning = function() {
	return isDraftRunning();
};

Template.CommandBar.DraftTimer = function() {
	return DraftTimer;
};

Template.CommandBar.events({
	"click .start-draft": function(e) {
		e.preventDefault();
		Meteor.call("startDraft");
		Session.set('isDraftRunning', true);
	},
	"click .pause-draft": function(e) {
		e.preventDefault();
		Session.set('isDraftRunning', false);
	}
});
