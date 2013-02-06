Meteor.subscribe("Drafts");

Template.DraftControl.isDraftRunning = function() {
	return isDraftRunning();
};

/**
 * @return {String}
 * @constructor
 */
Template.DraftControl.RunningClass = function() {
	if (isDraftRunning()) {
		return '';
	}

	return 'disabled';
};

Template.DraftControl.DraftTimer = function() {
	return Drafts.findOne({});
};

Template.DraftControl.events({
	"click button#draft-start": function(e) {
		e.preventDefault();
		Meteor.call("startDraft");
	},
	"click button#draft-stop": function(e) {
		e.preventDefault();
		Meteor.call("stoplDraft");
	},
	"click button#draft-pause": function(e) {
		e.preventDefault();
		Meteor.call("pauseDraft");
	}
});
