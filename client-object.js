/*******************************************************************
 * Implemntation of multi-user X3DOM - client side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 *
 * edited by: Karsten Dees, Nick Hu {09/16/2016}
 ******************************************************************/

//-----------------------------
// Data Fields
//-----------------------------
 
var name;
var socket;
var spawnPosition = {"x": 2, "y": 1.5, "z": 9};
var spawnOrientation = [{"x": 0, "y": 1, "z": 0}, 0];
var x3d;

//socket = new io.connect('http://dev.mirrorworlds.icat.vt.edu:9000');
//Use to connect to mirrorworlds server
//socket = new io.Socket("http://dev.mirrorworlds.icat.vt.edu:8888",{ port: 8888 });

//Use for localhost testing. Run node server 
socket = new io.connect('http://metagrid2.sv.vt.edu:8888');

/*
 * Initialized by client.js to get the user's name
 * and set up the scene
 */
function x3domWebsocketClient()
{
	name = prompt("Enter your name:");

	x3d = document.getElementsByTagName("X3D")[0];
	
	configureScene();
	
	socket.connect();
}

/*
 * Sets up the X3D scene
 */
function configureScene()
{
	console.log("Scene Configured");
	var camera = x3d.runtime.getActiveBindable("Viewpoint");
	var cPos = "" + spawnPosition.x + " " + spawnPosition.y + " " + spawnPosition.z;
	var cRot = "" + spawnOrientation[0].x + " " + spawnOrientation[0].y + " " + spawnOrientation[0].z + " " + spawnOrientation[1];
	camera.setAttribute("position", cPos);
	camera.setAttribute("orientation", cRot);
	var scene = document.getElementsByTagName("Scene")[0];
	var g = document.createElement('Group');
	g.setAttribute("id", "avatarGroup");
	scene.appendChild(g);
	var cams = document.getElementsByTagName('Viewpoint');
	for (var i = 0; i < cams.length; i++)
	{
		cams[i].addEventListener('viewpointChanged', positionUpdated, false);
	};
}

/*
 * Sends position data to server
 */
function positionUpdated(e)
{			
	var pos = e.position;
    var rot = e.orientation;
    
    //Tell the server that this client has moved and send its new location data
	socket.emit('updateposition', name, pos, rot);
}

//-----------------------------
// Listeners
//-----------------------------

/*
 * Tell the server the user has successfully connected and 
 *to add this client to the list of all clients
 */
socket.once('connect', function()
{
	socket.emit('newconnection');
});

/*
 * Received the first time this client connects to the server -- gets 
 * the client up to speed with all of the current data
 *
 * @param fullListOfUsers - the list of connected users
 */
socket.once('firstupdate', function(fullListOfUsers)
{
	// Adds Avatar to X3D scene for new user
	var hook = document.getElementById("avatarGroup");
	hook.innerHTML = "";
	
	for (var key in fullListOfUsers)
	{
		var current = fullListOfUsers[key];
		var userAvatar = document.createElement('Transform');
		userAvatar.setAttribute("translation", current[1].x + " " + current[1].y +  " " + current[1].z);
		userAvatar.setAttribute("rotation", current[2][0].x + " " + current[2][0].y + " " + current[2][0].z + " " + current[2][1]);
		userAvatar.setAttribute("id", key + "Avatar");
		console.log("created Node: " + userAvatar.getAttribute("id"));
		var i = document.createElement('inline');
		i.setAttribute("url", "pumbaPTrans1.x3d");

		userAvatar.appendChild(i);
		hook.appendChild(userAvatar);
	}
    
	//Build the list of connected users
	buildList(fullListOfUsers);
	
	//Tell the server the user's spawn location data
	socket.emit('login', name, spawnPosition, spawnOrientation);
});

/*
 * Triggered whenever the user changes location 
 * to update the X3D scene and the HTML tags
 *
 * @param updateUser - the updated user
 */
socket.on('update', function(updatedUser)
{
	console.log("Update Fired");
	
	// Update the scene
	var userAvatar = document.getElementById(updatedUser[0] + "Avatar");

	if(userAvatar != null)
	{
		//Update Avatar Data
		userAvatar.setAttribute("translation", updatedUser[1].x + " " + updatedUser[1].y + " " + updatedUser[1].z);
		userAvatar.setAttribute("rotation", updatedUser[2][0].x + " " + updatedUser[2][0].y + " " + updatedUser[2][0].z + " " + updatedUser[2][1]);
		
        //Update HTML
        updateList(updatedUser);
    
        //Update Server Location Information
        socket.emit('updatePosition', updatedUser[0], updatedUser[1], updatedUser[2]);
	};
});

/*
 * Triggered whenever a new user connects -- updates 
 * all users with the added user's information
 *
 * @param newestUser - the updated user
 * @param fullListOfUsers - all of the connected users
 */
socket.on('newuser', function(newestUser)
{
	var duplicateNames = document.getElementById(newestUser[0]);
	
	if(newestUser[0] != null && name != newestUser[0] && duplicateNames == null)
	{	
		//Add Users Avatar
        var hook = document.getElementById("avatarGroup");

		var userAvatar = document.createElement('Transform');

		userAvatar.setAttribute("translation", newestUser[1].x + " " + newestUser[1].y + " " + newestUser[1].z);
		userAvatar.setAttribute("rotation", newestUser[2][0].x + " " + newestUser[2][0].y + " " + newestUser[2][0].z + " " + newestUser[2][1]);
		userAvatar.setAttribute("id", newestUser[0] + "Avatar");
		console.log("Created node: " + userAvatar.getAttribute("id"));

		var inlineElement = document.createElement('inline');
		inlineElement.setAttribute("url", "pumbaPTrans1.x3d");
		inlineElement.setAttribute("mapDEFToID", "true");

		userAvatar.appendChild(inlineElement);
		hook.appendChild(userAvatar);
        
		//Update HTML
		addUser(newestUser);
	}
});

/*
 * Triggered whenever a user disconnects -- removes
 * the deleted user from everyone else's list
 *
 * @param removableUser - the user to be deleted
 */
socket.on('deleteuser', function(removableUser)
{
	// Remove the avatar from the scene.
	var removeAvatar = document.getElementById(removableUser[0] + "Avatar");

	if(removeAvatar != null)
	{
		var avatars = document.getElementById("avatarGroup");
		avatars.removeChild(removeAvatar);
	}
    
    //Remove User's HTML Content
    removeUser(removableUser);
});

