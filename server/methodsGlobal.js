var draftTimerInterval = null,
		cipherKey = 'n33ds0mehintbet1',
		cipherIv = '5622587455896325',
		cipherType = 'aes-128-cbc';

/**
 * Gets a json object from Jira.
 *
 * @param query
 * @return {*}
 */
function getJiraObject(query)
{
	var JiraRestUrl = Configs.findOne({Name: "JiraRestUrl"}).Value;
	return callJira("GET", JiraRestUrl + query);
}

/**
 * Makes a call to Jira.
 *
 * @param type
 * @param url
 * @return {*}
 */
function callJira(type, url) {
	var jiraUser = decryptValue(Configs.findOne({Name: "JiraCredentials"}).Value);

	var result = Meteor.http.call(type, url, {
		timeout: 30000,
		auth: jiraUser,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (result.content.substr(0, 1) == "<") {
		console.log(result.content);
		return false;
	}


	return JSON.parse(result.content);
}

/**
 * Adds a ticket to the system from a Jira ticket object.
 *
 * @param ticket
 */
function addJiraTicket(ticket)
{
	if (ticket) {
		var hours = 0;
		if (ticket.fields.timetracking != null) {
			hours = secondsToHours(ticket.fields.timetracking.originalEstimateSeconds);
		} else if (ticket.fields.progress != null) {
			hours = secondsToHours(ticket.fields.progress.total);
		}

		addTicket(ticket.key, ticket.fields.summary, ticket.fields.description, hours);
	}
}

/**
 * Encrypts a value.
 *
 * @param value
 * @return {*|Progress}
 */
function encryptValue(value)
{
	var crypto = require('crypto'),
			cipher = crypto.createCipheriv(cipherType, cipherKey, cipherIv),
			crypted = cipher.update(value, 'utf-8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

/**
 * Decrypts a value.
 *
 * @param value
 * @return {*|Progress}
 */
function decryptValue(value)
{
	var crypto = require('crypto'),
			decipher = crypto.createDecipheriv(cipherType, cipherKey, cipherIv),
			decrypted = decipher.update(value, 'hex', 'utf-8');
	decrypted += decipher.final('utf-8');
	return decrypted;
}

/**
 * Converts total seconds to hours. Jira stores time in seconds,
 * we user hours.
 *
 * @param seconds
 * @return {Number}
 */
function secondsToHours(seconds) {
	return (seconds / 60 / 60);
}

/**
 * Adds a ticket to the database.
 *
 * @param Id
 * @param Title
 * @param Description
 * @param Hours
 */
function addTicket(Id, Title, Description, Hours) {
	var ticket = Tickets.findOne({Id: Id});
	if (!ticket) {
		Tickets.insert({Id: Id, Title: Title, Description: Description, Hours: parseInt(Hours)});
	}
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

function createUserMessage(owner, message, type)
{
	UserMessages.insert({
		owner: owner,
		createdAt: (new Date()).getTime(),
		message: message,
		type: type
	})
}
