/* 
 * Implemntation of multi-user X3DOM - client side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 */

var name;
var socket;
var spawnPosition = {"x": 2, "y": 1.5, "z": 9};
var spawnOrientation = [{"x": 0, "y": 1, "z": 0}, 0];
var x3d;
var firstUpdate = false;

//socket = new io.connect('http://dev.mirrorworlds.icat.vt.edu:9000');
//Use to connect to mirrorworlds server
//socket = new io.Socket("http://dev.mirrorworlds.icat.vt.edu:8888",{ port: 8888 });
//Use for localhost testing. Run node server 
socket = new io.connect('http://metagrid2.sv.vt.edu:8888');

function x3domWebsocketClient()
{
	name = prompt("Enter your name:");

	x3d = document.getElementsByTagName("X3D")[0];
	
	configureScene();
	
	socket.connect();
}

socket.once('connect', function()
{
	console.log("ConnectFunction");

	
	// Tell the server to add this client to the list of all clients.
	socket.emit('newconnection');
});

/*
* Received the first time this client connects to the server -- gets 
* the client up to speed with all of the current data
*/
socket.once('firstupdate', function(data)
{
	console.log("1stUpdate");

	// Adds Avatar to X3D scene for new user
	/*
	var hook = document.getElementById("avatarGroup");
	hook.innerHTML = "";
	for (var key in data)
	{
		var current = data[key];
		var t = document.createElement('Transform');
		t.setAttribute("translation", current[1].x + " " + current[1].y + " " + current[1].z);
		t.setAttribute("rotation", current[2][0].x + " " + current[2][0].y + " " + current[2][0].z + " " + current[2][1]);
		t.setAttribute("id", key + "Avatar");
		console.log("created Node: " + t.getAttribute("id"));
		var i = document.createElement('inline');
		i.setAttribute("url", "content/avatars/redBox.x3d");

		t.appendChild(i);
		hook.appendChild(t);
	}
	*/
    
	buildList(data);
	
	socket.emit('login', name, spawnPosition, spawnOrientation);
	
	firstUpdate = true;
});

socket.on('update', function(data)
{
	console.log("Update Fired");
	
	// Update the scene
	
	var userAvatar = document.getElementById(data[0] + "Avatar");

	if(userAvatar != null)
	{
		//Avatar Data
		userAvatar.setAttribute("translation", data[1].x + " " + data[1].y + " " + data[1].z);
		userAvatar.setAttribute("rotation", data[2][0].x + " " + data[2][0].y + " " + data[2][0].z + " " + data[2][1]);
		
	
        //Update HTML
        updateList(data);
    
        //Update Server Location Information
        socket.emit('updatePosition', data[0], data[1], data[2]);
	};
	
	
	//Update HTML
	if (firstUpdate)
	{
		updateList(data);
	}
});

socket.on('newuser', function(data, fullListOfUsers)
{
	console.log("New User Fired");
	//console.log("User Name: ", name);
	//console.log("User Data: ", data[0]);
	console.log("LIST OF USERS: ", fullListOfUsers);
	
	var duplicateNames = document.getElementById(data[0]);
	
	if(data[0] != null && name != data[0] && duplicateNames == null)
	{	
		//Add Users Avatar
        var hook = document.getElementById("avatarGroup");

		var userAvatar = document.createElement('Transform');

		userAvatar.setAttribute("translation", data[1].x + " " + data[1].y + " " + data[1].z);
		userAvatar.setAttribute("rotation", data[2][0].x + " " + data[2][0].y + " " + data[2][0].z + " " + data[2][1]);
		userAvatar.setAttribute("id", data[0] + "Avatar");
		console.log("Created node: " + userAvatar.getAttribute("id"));

		var i = document.createElement('inline');		
		i.setAttribute("url", "content/avatars/redBox.x3d");

		userAvatar.appendChild(i);
		hook.appendChild(userAvatar);
        
		//Update HTML
		addUser(data);
	}
});

socket.on('deleteuser', function(data)
{
	// Remove the avatar from the scene.
	
	/*
	var removeAvatar = document.getElementById(data[0] + "Avatar");

	if(removeAvatar != null)
	{
		var avatars = document.getElementById("avatarGroup");
		avatars.removeChild(removeAvatar);
	}
	*/
    
    //Remove User's HTML Content
    remUser(data);
});

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

function positionUpdated(e)
{			
	var pos = e.position;
    var rot = e.orientation;
    
    //Tell the server that this client has moved and send its new location data
	socket.emit('updateposition', name, pos, rot);
}