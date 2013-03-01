/**
 * Created with JetBrains PhpStorm.
 * User: paul
 * Date: 3/1/13
 * Time: 11:33 AM
 * To change this template use File | Settings | File Templates.
 */

Meteor.subscribe("UserMessages");

Template.UserMessages.Messages = function() {
	return UserMessages.find({});
};

Template.UserMessages.events({
	"click button.close": function(e,t) {
		UserMessages.remove({_id: this._id});
	}
});
