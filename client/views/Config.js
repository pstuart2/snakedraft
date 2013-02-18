Meteor.subscribe("Configs");

// When editing a list name, ID of the list
Session.set('editing_config', null);

////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
	var ok = callbacks.ok || function () {};
	var cancel = callbacks.cancel || function () {};

	var events = {};
	events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
			function (evt) {
				if (evt.type === "keydown" && evt.which === 27 ||
						evt.type === "focusout") {
					// escape = cancel
					cancel.call(this, evt);

				} else if (evt.type === "keyup" && evt.which === 13) {
					// blur/return/enter = ok/submit if non-empty
					var value = String(evt.target.value || "");
					if (value)
						ok.call(this, value, evt);
					else
						cancel.call(this, evt);
				}
			};
	return events;
};

var activateInput = function (input) {
	input.focus();
	input.select();
};

Template.Config.editing = function () {
	return Session.equals('editing_config', this._id);
};

Template.Config.ConfigsArr = function() {
	return Configs.find({IsVisible: true}, {sort: {Name: 1}});
};

Template.Config.events({
	"click button.config": function() {
		$("#configs").toggle();
	},
	"click .config-item": function (evt, tmpl) { // start editing
		console.log("Editing Config: " + this.Name);
		Session.set('editing_config', this._id);
		Meteor.flush(); // force DOM redraw, so we can focus the edit field
		activateInput(tmpl.find("#value-input"));
	}
});

Template.Config.events(okCancelEvents(
		'#value-input',
		{
			ok: function (value) {
				console.log("Saving Config: " + this._id);
				Meteor.call("updateConfig", this._id, value);
				Session.set('editing_config', null);
			},
			cancel: function () {
				Session.set('editing_config', null);
			}
		}));
