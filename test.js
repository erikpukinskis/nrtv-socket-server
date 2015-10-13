var test = require("nrtv-test")(require)

test.using(
  "hi",
  ["./socket-server", "ws", "nrtv-server", "querystring"],
  function(expect, done, SocketServer, WebSocket, nrtvServer, querystring) {

    var server = new SocketServer()

    nrtvServer.start(8000)

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

    // handler.send({})
    // server.send()




  }
)

