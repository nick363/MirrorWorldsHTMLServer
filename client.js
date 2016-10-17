/**********************************************
 * Strictly handles client side HTML updates
 *
 * edited by: Karsten Dees, Nick Hu {09/16/2016}
 **********************************************/

//-----------------------------
// Data Fields
//-----------------------------
 
var clientSocket;

//-----------------------------
// Initialize Function
//-----------------------------

/*
 * Start up client side operations
 */
function init()
{
	clientSocket = new x3domWebsocketClient();
}

//-----------------------------
// HTML Manipulators
//-----------------------------

/*
 * Builds HTML list of connected users
 *
 * @param fullListOfUsers - the list of connected users
 */
var buildList = function(fullListOfUsers)
{
	var userList = document.getElementById("users");
	userList.innerHTML = "";

	//Add each user to the HTML list
	for (var key in fullListOfUsers)
	{
		var current = fullListOfUsers[key];
		var userListEntry = document.createElement('span');
		var newPLine = document.createElement('p');
		userListEntry.setAttribute("id", key);
		userListEntry.innerHTML = (key + " observing at: " + current[1].x + ", " + current[1].y + ", " + current[1].z);
		userList.appendChild(newPLine);					
		userList.appendChild(userListEntry);
	}
}

/*
 * Adds a new user to the HTML list of users
 *
 * @param newestUser - user to be added to the list
 */
var addUser = function(newestUser)
{
	console.log("Adding User: ", newestUser[0]);
	var userList = document.getElementById("users");
	var userListEntry = document.createElement('span');
	var newPLine = document.createElement('p');
	userListEntry.setAttribute("id", newestUser[0]);
	userListEntry.innerHTML = (newestUser[0] + " observing at: " + newestUser[1].x + ", " + newestUser[1].y + ", " + newestUser[1].z);
	userList.appendChild(newPLine);
	userList.appendChild(userListEntry);
}

/*
 * Removes a user from the HTML list of users
 *
 * @param goodbyeUser - user to be deleted
 */
var removeUser = function(goodbyeUser)
{
	var users = document.getElementById("users");
	var remove2 = document.getElementById(goodbyeUser[0]);
	users.removeChild(remove2);
}

/*
 * Updates the HTML list with new position data
 *
 * @param updateUser - the updated user
 */
var updateList = function(updateUser)
{
	var target = document.getElementById(updateUser[0]);
	target.innerHTML = (updateUser[0] + " observing at: " + updateUser[1].x + ", " + updateUser[1].y + ", " + updateUser[1].z);
}