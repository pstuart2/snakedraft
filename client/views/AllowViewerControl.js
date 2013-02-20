Template.AllowViewerControl.events = {
	"click button.btn-danger": function() {
		SessionAmplify.set("allowViewerControl", null);
	},
	"click button.btn-primary": function() {
		var vcPassword = $("#vcPassword");

		Meteor.call("checkViewerControlPassword", vcPassword.val(), function(err, res) {
			if (res) {
				SessionAmplify.set("allowViewerControl", true);
			}
		});

		vcPassword.val(null);
	}
};
