/**
 * Created with JetBrains PhpStorm.
 * User: paul
 * Date: 4/23/13
 * Time: 2:18 PM
 * To change this template use File | Settings | File Templates.
 */
Template.UserOptions.created = function() {
	SessionAmplify.setDefault("AttachedDraftArea", true);
};

Template.UserOptions.rendered = function() {
	$("input#AttachedDraftArea").prop("checked", SessionAmplify.get("AttachedDraftArea"));
};

Template.UserOptions.events({
	"click button.save-user-options": function(e, t) {
		SessionAmplify.set("AttachedDraftArea", $("input#AttachedDraftArea").prop("checked"));
	}
});
