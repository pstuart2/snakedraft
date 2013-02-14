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
	console.log("------");
	console.log($('ul.chat-list').height());
	console.log($("ul.chat-list").prop("scrollHeight"));
	$("ul.chat-list").animate({ scrollTop: $("ul.chat-list").prop("scrollHeight") }, 500);
};

Template.Chat.Messages = function() {
	return Messages.find({});
};

Template.Chat.events({

});

Template.Chat.events(okCancelEvents(
		'#chatInput',
		{
			ok: function (value) {
				Messages.insert({user: Meteor.user().username, created: new Date(), message: value});
				$("#chatInput").val(null);
			},
			cancel: function () {

			}
		}));