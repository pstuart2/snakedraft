Meteor.subscribe("Drafts");

Template.DraftControl.rendered = function() {
	// Make sure our stuff lines up.
	var draft = Drafts.findOne({}),
			wclass;
	if (draft) {

		// Using sessions here so that templates will update when the session variable
		// actually changes, not any item on the draft.
		SessionAmplify.set('isDraftRunning', draft.isRunning);
		SessionAmplify.set('isDraftPaused', draft.isPaused);
		SessionAmplify.set('cycleType', draft.cycleType);
		SessionAmplify.set('draftTime', draft.currentTime);

		if (draft.isRunning && !draft.isPaused) {
			if (draft.currentTime > 20) { wclass = "success-back"; }
			else if (draft.currentTime <= 10) { wclass = "danger-back"; }
			else {
				wclass = "warning-back";
			}
		}

		SessionAmplify.set("draftTimeBack", wclass);

		if (draft.isRunning) {
			SessionAmplify.set('draftCurrentUser', draft.currentUser);
		} else {
			SessionAmplify.set('draftCurrentUser', null);
		}
	}
};

Template.DraftControl.Draft = function() {
	return Drafts.findOne({});
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

		// Get our first player.
		var firstPlayer = Meteor.users.findOne(
				{"profile.hoursLeft": {$gt: 0}},
				{sort: {"profile.draftPosition": 1}});

		// Set our starting user in the draft.
		Drafts.update({}, {$set: {currentUser: firstPlayer._id, isRunning: true, currentPosition: firstPlayer.profile.draftPosition, direction: 1}},
				{multi: false});

		Meteor.call("startDraft", function(error, data) {
			if (error) {
				alertify.error(error.reason);
			}
		});
	},
	"click button#draft-stop": function(e) {
		e.preventDefault();
		Meteor.call("stopInterval", function(error, data) {
			if (error) {
				alertify.error(error.reason);
			} else {
				resetDraft();
			}
		});

	},
	"click button#draft-pause": function(e) {
		e.preventDefault();
		if (!isDraftRunning()) { return; }

		//SessionAmplify.set('isDraftPaused', !SessionAmplify.get('isDraftPaused'));
		if (!SessionAmplify.get('isDraftPaused')) {
			Meteor.call("stopInterval", function(e, d) {
				if (e) { alertify.error(e.reason); }
			});
		} else {
			Meteor.call("startInterval", function(e, d) {
				if (e) { alertify.error(e.reason); }
			});
		}

		Drafts.update({},
				{$set: {isPaused: !SessionAmplify.get('isDraftPaused')}},
				{multi: false});
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
