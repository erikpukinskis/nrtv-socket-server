var test = require("nrtv-test")(require)
var library = test.library

test.using(
  "receives data through a websocket",
  ["./socket-server", "ws", library.reset("nrtv-server"), "querystring"],
  function(expect, done, socketServer, WebSocket, nrtvServer, querystring) {

    socketServer.adoptConnections(
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
