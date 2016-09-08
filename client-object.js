/* 
 * Implemntation of multi-user X3DOM - client side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 */

var name;
var socket;
var spawnPosition = {"x":2, "y":1.5, "z":9};
var spawnOrientation = [{"x":0, "y":1, "z":0}, 0];
var x3d;
var allowuUpdate = false;


function x3domWebsocketClient(sync, newUser, removeUser, update)
{
	name = prompt("Enter your name:");

	x3d = document.getElementsByTagName("X3D")[0];

	configureScene();
	
	//socket = new io.connect('http://dev.mirrorworlds.icat.vt.edu:9000');
	//Use to connect to mirrorworlds server
	//socket = new io.Socket("http://dev.mirrorworlds.icat.vt.edu:8888",{ port: 8888 });
	//Use for localhost testing. Run node server  
	socket = new io.connect('http://metagrid2.sv.vt.edu:8888');
	socket.connect();
	
	socket.on('connect', function()
		{
		    console.log("ConnectFunction");
			// Tell the server to add this client to the list of all clients.
			socket.emit('newconnection');
		});

	socket.on('firstupdate', function(data)
		{
			// Recieved the first time this client connects to the server.
			// Gets the client up to speed with all of the current data.

			// Update the scene.
			console.log("1stUpdate");
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
				var i = document.createElement('inline')			
				i.setAttribute("url", "content/avatars/redBox.x3d")
	
				t.appendChild(i);
				hook.appendChild(t);
			}

			// Send the data to the callback
			if(sync != null)
			{
				sync(data);
			};

			socket.emit('login', name, spawnPosition, spawnOrientation);
		});

	socket.on('update', function(data)
		{
			console.log("Updated");
			// Update the scene
			var t = document.getElementById(data[0] + "Avatar");
			
			if(t != null)
			{
				t.setAttribute("translation", data[1].x + " " + data[1].y + " " + data[1].z);
				t.setAttribute("rotation", data[2][0].x + " " + data[2][0].y + " " + data[2][0].z + " " + data[2][1]);
			};

			if (update != null)
			{
				update(data);
			};
		});

	socket.on('newuser', function(data)
		{
			console.log("NewUser");
			if(data[0] != name)
			{
				// Update the scene.
				var hook = document.getElementById("avatarGroup");

				var t = document.createElement('Transform');

				t.setAttribute("translation", data[1].x + " " + data[1].y + " " + data[1].z);
				t.setAttribute("rotation", data[2][0].x + " " + data[2][0].y + " " + data[2][0].z + " " + data[2][1]);
				t.setAttribute("id", data[0] + "Avatar");

				console.log("Created node: " + t.getAttribute("id"));

				var i = document.createElement('inline');		
				i.setAttribute("url", "content/avatars/redBox.x3d");

				t.appendChild(i);
				hook.appendChild(t);

				if (newUser != null)
				{
					newUser(data);
				};
				// Update the list of users.
//				var userList = document.getElementById("users");
//				var userListEntry = document.createElement('span');
//				var br = document.createElement('br');
//				userListEntry.setAttribute("id", data[0]);
//				userListEntry.innerHTML = (data[0] + " observing at: " + data[1].x + ", " + data[1].y + ", " + data[1].z);
//
//				userList.appendChild(br);
//				userList.appendChild(userListEntry);
			}

			allowuUpdate = true;

		});

	socket.on('deleteuser', function(data)
		{
			console.log("UserDeleted");
			// Remove the avatar from the scene.
			var avatars = document.getElementById("avatarGroup");
			var remove1 = document.getElementById(data[0] + "Avatar");
			avatars.removeChild(remove1);
			
			if (removeUser != null)
			{
				removeUser(data);
			};
			// Remove the user from the list of users.
//			var users = document.getElementById("users");
//			var remove2 = document.getElementById(name);
//			users.removeChild(remove2);

		});
}

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
    //console.log([name, pos, rot]);
    //Tell the server that this client has moved and send its new location data

	socket.emit('updateposition', name, pos, rot);
}
