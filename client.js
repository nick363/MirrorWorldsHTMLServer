/* 
 * The client end of the x3dom web system
 */
var sh;

function init()
{
	sh = new x3domWebsocketClient(buildList, addUser, remUser, updateList);
}

var buildList = function(data)
{
	var userList = document.getElementById("users");
	userList.innerHTML = "";

	for (var key in data)
	{
		var current = data[key];
		var userListEntry = document.createElement('span');
		var br = document.createElement('br');
		userListEntry.setAttribute("id", key);
		userListEntry.innerHTML = (key + " observing at: " + current[1].x + ", " + current[1].y + ", " + current[1].z);
		userList.appendChild(br);					
		userList.appendChild(userListEntry);
	}
}

var addUser = function(data)
{
	var userList = document.getElementById("users");
	var userListEntry = document.createElement('span');
	var br = document.createElement('br');
	userListEntry.setAttribute("id", data[0]);
	userListEntry.innerHTML = (data[0] + " observing at: " + data[1].x + ", " + data[1].y + ", " + data[1].z);
	userList.appendChild(br);
	userList.appendChild(userListEntry);
}

var remUser = function(data)
{
	var users = document.getElementById("users");
	var remove2 = document.getElementById(data[0]);
	users.removeChild(remove2);
}

var updateList = function(data)
{
	console.log(data);
	console.log(data[0]);
	var target = document.getElementById(data[0]);
	target.innerHTML = (data[0] + " observing at: " + data[1].x + ", " + data[1].y + ", " + data[1].z);
}