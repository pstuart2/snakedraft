Meteor.subscribe("Drafts");

Template.DraftControl.rendered = function() {
	// Make sure our stuff lines up.
	var draft = Drafts.findOne({});
	if (draft) {
		//console.log("Found draft, setting sessions.");
		Session.set('isDraftRunning', draft.isRunning);
		Session.set('isDraftPaused', draft.isPaused);
	}
};

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

/**
 * @return {String}
 * @constructor
 */
Template.DraftControl.WarningClass = function(time) {
	var wclass = "";

	if (isDraftRunning() && !isDraftPaused()) {
		if (time > 20) { wclass = "alert-success"; }
		else if (time <= 10) { wclass = "alert-error"; }
	} else {
		wclass = "alert-info";
	}

	return wclass;
};

Template.DraftControl.DraftTimer = function() {
	return Drafts.findOne({});
};

Template.DraftControl.events({
	"click button#draft-start": function(e) {
		e.preventDefault();
		Meteor.call("startDraft");
		Session.set('isDraftRunning', true);
	},
	"click button#draft-stop": function(e) {
		e.preventDefault();
		Meteor.call("stopDraft");
		Session.set('isDraftRunning', false);
	},
	"click button#draft-pause": function(e) {
		e.preventDefault();
		if (!isDraftRunning()) { return; }

		Meteor.call("pauseDraft");
		Session.set('isDraftPaused', !Session.get('isDraftPaused'));
	}
});
