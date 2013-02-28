Meteor.subscribe("Drafts");

Template.DraftControl.rendered = function() {
	// Make sure our stuff lines up.
	var draft = Drafts.findOne({});
	if (draft) {
		// Using sessions here so that templates will update when the session variable
		// actually changes, not any item on the draft.
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

Template.DraftControl.Draft = function() {
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
		if (!Drafts.findOne({}).isRunning) { return; }

		Meteor.call("pauseDraft");
		SessionAmplify.set('isDraftPaused', !SessionAmplify.get('isDraftPaused'));
	},
	"click button#draft-skip": function(e) {
		e.preventDefault();
		if (!Drafts.findOne({}).isRunning) { return; }

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
