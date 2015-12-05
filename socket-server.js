var library = require("nrtv-library")(require)

var toot

module.exports = library.export(
  "nrtv-socket-server",
  ["sockjs", "nrtv-server", "http", "nrtv-browser-bridge"],
  function(sockjs, nrtvServer, http, bridge) {

    var socket
    var adopters = []

    function takeOverServer(server) {
      server = server || nrtvServer
      if (server.__isInfectedWithNrtvSockets) {
        return
      }

      socket = sockjs.createServer()

      var app = server.express()

      var httpServer = http.createServer(app);

      socket.installHandlers(httpServer, {prefix: "/echo"})

      adopters.push(function(conn) {
        console.log("unadopted conn!")
      })

      server.relenquishControl(
        function start(port) {
          httpServer.listen(port)
          console.log("listening on "+port+" (for websockets too)")
          return httpServer
        })

      socket.on("connection", handleNewConnection)

      server.__isInfectedWithNrtvSockets = true
    }

    function adoptConnections(handler, server) {
      takeOverServer(server)
      adopters.push(handler)
    }

    function handleNewConnection(connection) {
      var i = adopters.length - 1

      tryAnother()

      function tryAnother() {
        var adopter = adopters[i--]

        if (adopter) {
          adopter(connection, tryAnother)
        }
      }
    }

    return {
      handleNewConnection: handleNewConnection,
      adoptConnections: adoptConnections,
      takeOverServer: takeOverServer
    }
  }  
)