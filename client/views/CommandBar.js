Template.CommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.CommandBar.isDraftRunning = function() {
	return isDraftRunning();
};

Template.CommandBar.notIsDraftRunning = function() {
	return !isDraftRunning();
};

Template.CommandBar.events({
	"click a.randomize-draft": function(e) {
		e.preventDefault();

		var currentUser = getUser(Meteor.userId());

		var draft = Drafts.findOne({});
		if (!(currentUser.profile.isAdmin || draft.isRunning)) {
			throw new Meteor.Error(404, "You cannot do that!");
		}

		var peeps = getUsers({'profile.isScrumMaster': false}),
				newPeepPos = [],
				arrPos = 0;

		peeps.forEach(function(peep)
		{
			newPeepPos[arrPos++] = {id: peep._id};
		});


		newPeepPos = fisherYates(newPeepPos);

		arrPos = 1;
		_.each(newPeepPos, function(newPos) {

			Meteor.users.update({_id: newPos.id},
					{
						$set: {'profile.draftPosition': arrPos++}
					},
					{multi: false});

		});
	}
});
