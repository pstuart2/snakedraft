Meteor.subscribe("Messages");

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

Template.Chat.rendered = function() {
	var $cl = $("ul.chat-list");
	$cl.animate({ scrollTop: $cl.prop("scrollHeight") }, 500);
};

Template.Chat.Messages = function() {
	return Messages.find({});
};

Template.Chat.events(okCancelEvents(
		'#chatInput',
		{
			ok: function (value) {
				// Every one can see all messages. Easily insert form the client side.
				// Record is inserted client side mini-mongo so it looks immediate, then synced with the server
				// and pushed to all other clients.
				Messages.insert({user: Meteor.user().username, created: new Date(), message: value});

				// Clear input box.
				$("#chatInput").val(null);
			},
			cancel: function () {

			}
		}));
