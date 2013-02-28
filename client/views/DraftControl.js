Meteor.subscribe("Drafts");

Template.DraftControl.rendered = function() {
	// Make sure our stuff lines up.
	var draft = Drafts.findOne({});
	if (draft) {
		SessionAmplify.set('isDraftRunning', draft.isRunning);
		SessionAmplify.set('isDraftPaused', draft.isPaused);
		SessionAmplify.set('cycleType', draft.cycleType);
		SessionAmplify.set('draftTime', draft.currentTime);

		if (draft.isRunning) {
			SessionAmplify.set('draftCurrentUser', draft.currentUser);
		} else {
			SessionAmplify.set('draftCurrentUser', null);
		}
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
Template.DraftControl.WarningClass = function() {
	var wclass = "",
			time = getDraftTime();

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
		Meteor.call("startDraft", function(error, data) {
			if (!error) {
				var draft = Drafts.findOne({});
				updateDraftSettings(draft);
			}
		});
	},
	"click button#draft-stop": function(e) {
		e.preventDefault();
		Meteor.call("stopDraft", function(error, data) {
			if (!error) {
				var draft = Drafts.findOne({});
				updateDraftSettings(draft);
			}
		});

	},
	"click button#draft-pause": function(e) {
		e.preventDefault();
		if (!isDraftRunning()) { return; }

		Meteor.call("pauseDraft");
		SessionAmplify.set('isDraftPaused', !SessionAmplify.get('isDraftPaused'));
	},
	"click button#draft-skip": function(e) {
		e.preventDefault();
		if (!isDraftRunning()) { return; }

		Meteor.call("skipTurn");
	}
});

function updateDraftSettings(draft)
{
	SessionAmplify.set('isDraftRunning', draft.isRunning);
	SessionAmplify.set('isDraftPaused', draft.isPaused);
	SessionAmplify.set('cycleType', draft.cycleType);
	SessionAmplify.set('draftTime', draft.currentTime);
	SessionAmplify.set('draftCurrentUser', draft.currentUser);
}
