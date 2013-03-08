// This is executed in both client and server
function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var __hoursPerDay = 0;
function hoursPerDay()
{
	if(__hoursPerDay == 0) {
		var hpd = Configs.findOne({Name: "HoursPerDay"});
		if(hpd) {
			__hoursPerDay = parseInt(hpd.Value);
		}
	}
	return __hoursPerDay;
}

function hoursToDaysHours(totalHours) {
	var hoursInDay = hoursPerDay(),
			result = {days: 0, hours: 0};

	result.hours = parseInt(totalHours);
	result.days = parseInt(result.hours / hoursInDay);
	result.hours = result.hours - (result.days * hoursInDay);

	return result;
}

function hoursDaysToTotalHours(hours, days) {
	var hoursInDay = hoursPerDay();
	return (parseInt(hours) + (parseInt(days) * hoursInDay));
}

function formatTotalHours(totalHours) {
	var result = hoursToDaysHours(totalHours);
	return result.days + "d " + result.hours + "h";
}

/**
 * Gets a user and its profile.
 *
 * @param userId
 * @return {*|Cursor}
 */
function getUser(userId)
{
	return Meteor.users.findOne({_id: userId}, {fields: {username: 1, profile: 1}});
}

/**
 * Gets a set of users based on a filter.
 *
 * @param filter
 * @return {*}
 */
function getUsers(filter)
{
	return Meteor.users.find(filter, {fields: {username: 1, profile: 1}})
}

/**
 * Assigns a ticket to a user.
 *
 * @param userId
 * @param ticketId
 * @param hours
 */
function assignTicketToUser(userId, ticketId, hours) {
	Tickets.update({_id: ticketId},
			{$set: {AssignedUserId: userId}},
			{multi: false},function(error) {
				if(error) {
					alertify.error(error.reason);
				}
			});

	assignHoursToUser(userId, hours);
}

function assignHoursToUser(userId, hours)
{
	var user = Meteor.users.findOne({_id: userId}),
			newHoursLeft = user.profile.hoursLeft - hours,
			newHoursAssigned = user.profile.hoursAssigned + hours,
			userAdjusted;

	if (newHoursLeft < 0) {
		userAdjusted = hours + newHoursLeft;
		newHoursLeft = 0;
	} else {
		userAdjusted = hours;
	}

	Meteor.users.update({_id: user._id},
			{$set: {'profile.hoursLeft': newHoursLeft, 'profile.hoursAssigned': newHoursAssigned}},
			{multi: false},function(error) {
				if(error) {
					alertify.error(error.reason);
				}
			});

	updateGlobalTicketHours(userAdjusted, hours);
}

function unassignHoursFromUser(userId, hours)
{
	var user = Meteor.users.findOne({_id: userId}),
			newHoursAssigned = user.profile.hoursAssigned - hours,
			newHoursLeft, userAdjusted;

	if (newHoursAssigned < 0) { newHoursAssigned = 0; }
	newHoursLeft = user.profile.hoursAvailable - newHoursAssigned;
	userAdjusted = user.profile.hoursLeft - newHoursLeft;

	Meteor.users.update({_id: user._id},
			{$set: {'profile.hoursLeft': newHoursLeft, 'profile.hoursAssigned': newHoursAssigned}},
			{multi: false},function(error) {
				if(error) {
					alertify.error(error.reason);
				}
			});

	updateGlobalTicketHours(userAdjusted, -hours);
}

function updateGlobalTicketHours(userHours, ticketHours)
{
	Drafts.update({}, {$inc: {
		remainingUserHours: -userHours,
		remainingTicketHours: -ticketHours
	}}, {multi: false},function(error) {
		if(error) {
			alertify.error(error.reason);
		}
	});
}

/**
 * Resets the draft to the starting point.
 */
function resetDraft()
{
	var SecondsPerChoice = Configs.findOne({Name: 'SecondsPerChoice'});

	Drafts.update({},
			{$set: {
				turnTime: parseInt(SecondsPerChoice.Value),
				currentTime: parseInt(SecondsPerChoice.Value),
				isRunning: false,
				isPaused: false,
				forcedTicketSize: 0,
				currentPosition: 1
			}
			},
			{multi: false});
}

/**
 * Moves a user to a new position in the draft order.
 *
 * @param userId
 * @param newDraftPos
 */
function movePeep(userId, newDraftPos)
{
	var pos,
			endPos,
			increment,
			userCount,
			oldUserRec = getUser(userId);

	// Get our user count so we do not exceed our draft position.
	userCount = Meteor.users.find({}).count();
	if (userCount < newDraftPos) {
		// Draft position exceeded, change to last place.
		newDraftPos = userCount;
	}

	// Update our user.
	Meteor.users.update({_id: userId},
			{
				$set: {'profile.draftPosition': newDraftPos}
			},
			{multi: false});

	// Determine if we are moving up or moving down.
	if (oldUserRec.profile.draftPosition > newDraftPos) {
		pos = newDraftPos;
		endPos = oldUserRec.profile.draftPosition;
		increment = 1;
	} else {
		pos = oldUserRec.profile.draftPosition;
		endPos = newDraftPos;
		increment = -1;
	}

	// Update the other users draft positions.
	Meteor.users.update({
				'profile.draftPosition': {
					$gte: pos,
					$lte: endPos
				},
				_id: {$ne: userId}
			},
			{$inc: {'profile.draftPosition': increment}},
			{multi: true});
}

/**
 * http://en.wikipedia.org/wiki/Fisher-Yates_shuffle
 *
 * @param myArray
 * @return {*}
 */
function fisherYates ( myArray ) {
	var i = myArray.length, j, tempi, tempj;
	if ( i == 0 ) return false;
	while ( --i ) {
		j = Math.floor( Math.random() * ( i + 1 ) );
		tempi = myArray[i];
		tempj = myArray[j];
		myArray[i] = tempj;
		myArray[j] = tempi;
	}

	return myArray;
}
