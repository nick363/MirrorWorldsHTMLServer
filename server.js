/*******************************************************************
 * Implemntation of multi-user X3DOM - server side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 *
 * edited by: Karsten Dees, Nick Hu {09/16/2016}
 *******************************************************************/

//-----------------------------
// Data Fields
//-----------------------------
 
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')

var users = {}; //List of Connected Users

app.listen(9999);

/*
 * Handle incorrect Path Names for the server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 */
function handler (req, res) 
{
  var pathname = url.parse(req.url).pathname;
  fs.readFile(__dirname + pathname,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading' + pathname);
    }

    res.writeHead(200);
    res.end(data);
  });
}

/*
 * Socket Connection and defined socket events
 *
 * @param socket - the connected socket
 */
io.on('connection', function (socket)
{ 

 /*
  * Recieved when a new client opens a websocket connection succesfully
  */
  socket.on('newconnection', function()
  {
	// Add the new client to the list of all clients
	console.log("New user is connecting...");
	try {
		io.emit('firstupdate', users);
    } catch (e) {
		console.log(e);
	}
  });
 
  /*
  * Recieved when a client sends a chat message
  */
  socket.on('chatmessage', function(message)
  {
	io.emit('newmessage', message);
  });
 
 /*
  * Recieved when a new client has successfully updated
  * for the first time
  *
  * @param name - client's username
  * @param pos - client's start position in the scene
  * @param rot - client's start rotation in the scene
  */
  socket.on('login', function(name, pos, rot)
  {
    console.log("New user '" + name + "' has connected.");
    
    socket.username = name;
    
    users[name] = [name, pos, rot];

    // Inform all clients to update and account for the new user.
	try {
		io.emit('newuser', users[name], users);
	} catch (e) {
		console.log(e);
	}
  });

 /*
  * Recieved when the client has changed the position
  * of their avatar
  *
  * @param name - client's username
  * @param pos - client's start position in the scene
  * @param rot - client's start rotation in the scene
  */
  socket.on('updateposition', function(name, pos, rot)
  {
	  console.log("UpdatingPosition: ", name);
    // Update the master list with the client's new location.
    users[name] = [name, pos, rot];

    // Inform all clients to update their scenes
	try {
		io.emit('update', users[name]);
	} catch (e) {
		console.log(e);
	}
  });

 /*
  * Recieved when a client disconnects (closes their browser window/tab).
  *
  * @param name - client's username
  * @param pos - client's start position in the scene
  * @param rot - client's start rotation in the scene
  */
  socket.on('disconnect', function()
  {
	  // Inform all clients to update and account for the removed user.
	  io.emit('deleteuser', users[socket.username]);
	  
	  // Remove the client from the master list
	  delete users[socket.username];
  });
});