/**
 * Created with JetBrains PhpStorm.
 * User: paul
 * Date: 3/2/13
 * Time: 9:45 AM
 * To change this template use File | Settings | File Templates.
 */
Meteor.subscribe("Drafts");

Template.Stats.Draft = function() {
	return Drafts.findOne({});
};

Template.Stats.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};
