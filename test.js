var test = require("nrtv-test")(require)
var library = test.library

// test.only("bridge bindings can listen and send")

test.using(
  "bridge bindings can listen and send",
  ["./socket-server", "nrtv-browser-bridge", library.reset("nrtv-server"), "nrtv-browse"],
  function(expect, done, socketServer, bridge, server, browse) {

    var listen = bridge.defineFunction(
      [socketServer.defineInBrowser()],
      function(getServer) {

        getServer(function(server) {
          server.onmessage = function(message) {
            server.send("got "+message.data)
          }
        })

      }
    )

    socketServer.adoptConnections(function(connection) {

      connection.write("doodie")

      connection.on("data",
        function(message) {
          expect(message).to.equal("got doodie")
          done()
          server.stop()
        }
      )
    })

    bridge.asap(listen)

    server.get("/", bridge.sendPage())

    server.start(2999)

    browse("http://localhost:2999")
  }
)

setTimeout(function() {
test.using(
  "receives data through a websocket",
  ["./socket-server", "ws", library.reset("nrtv-server"), "querystring"],
  function(expect, done, SocketServer, WebSocket, nrtvServer, querystring) {

    var server = new SocketServer()

    server.adoptConnections(
      function(connection, next) {
        var params = querystring.parse(connection.url.split("?")[1])

        var wantIt = params.__nrtvSingleUseSocketIdentifier == "102dk102ke2"

        if (wantIt) {
          connection.on("data", expectSingle)
        } else {
          next()
        }
      }
    )

    nrtvServer.start(8000)

    function sendMessage(message) {
      var ws = new WebSocket('ws://localhost:8000/echo/websocket?__nrtvSingleUseSocketIdentifier=102dk102ke2')
       
      ws.on("open", function() {
        ws.send(message)
      })
    }

    sendMessage("barf")

    function expectSingle(data) {
      expect(data).to.equal("barf")
      done()
      nrtvServer.stop()
    }

  }
)
}, 100) // There is a socket hang up error without this. Not sure why.
