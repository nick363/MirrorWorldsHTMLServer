/* 
 * Implemntation of multi-user X3DOM - server side.
 * author: Matthew Bock
* This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 */

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')

var users = {};

//io.set("log level", 2);

app.listen(8888);

function handler (req, res) 
{
  var pathname = url.parse(req.url).pathname;
   // res.write('Hello World');
   // res.end();
   // return;
  fs.readFile(__dirname + pathname,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading' + pathname);
    }

    res.writeHead(200);
    res.end(data);
	//res.close();
  });
}

io.on('connection', function (socket)
{ // Define socket events
  console.log("new connection");
  socket.on('newconnection', function()
    {
      // Recieved when a new client opens a websocket connection succesfully.
      // Add the new client to the list of all clients.
      console.log("New user is connecting...");
	try {
      io.emit('firstupdate', users);
    } catch (e) {
		console.log(e);
	}
	}
	)

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

  socket.on('updateposition', function(name, pos, rot)
  {
    //Recieved when one of the clients moves.
    //console.log("User '" + name + "' moved to:" + pos.x + ", " + pos.y + ", " + pos.z + "; "
    //                           + rot[0].x + ", " + rot[0].y + ", " + rot[0].z + ", " + rot[1]);

    // Update the master list with the client's new location.
    users[name] = [name, pos, rot];

    // Inform all clients to update with the new list.
	try {
		io.emit('update', users[name]);
	} catch (e) {
		console.log(e);
	}
  });

  socket.on('disconnect', function()
  {
    // Recieved when a client disconnects (closes their browser window/tab).
    console.log("User '" + socket.username + "' disconnected");

    // Inform all clients to update and account for the removed user.
    io.emit('deleteuser', users[socket.username]);

    // Remove the client from the master list
    delete users[socket.username];
  });
});