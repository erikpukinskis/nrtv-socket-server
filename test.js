var test = require("nrtv-test")(require)
var library = test.library

test.using(
  "receives data through a websocket",
  ["./socket-server", "ws", "nrtv-server", "querystring"],
  function(expect, done, SocketServer, WebSocket, Server, querystring) {

    var server = new Server()

    var socketServer = SocketServer.onServer(server)

    socketServer.use(
      function(connection, next) {
        var params = querystring.parse(connection.upgradeReq.url.split("?")[1])

        var wantIt = params.__nrtvSingleUseSocketIdentifier == "102dk102ke2"

        if (wantIt) {
          connection.on("message", expectSingle)
        } else {
          next()
        }
      }
    )

    server.start(8000)

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
      server.stop()
    }

  }
)
