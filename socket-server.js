var library = require("nrtv-library")(require)

var toot

module.exports = library.export(
  "nrtv-socket-server",
  ["sockjs", "nrtv-server", "http", "nrtv-browser-bridge"],
  function(sockjs, nrtvServer, http, bridge) {

    function SocketServer(server) {
      this.adopters = []
      this.nrtvServer = server
      this._takeOver()
    }

    SocketServer.prototype.use =
      function(handler) {
        this.adopters.push(handler)
      }

    SocketServer.prototype._takeOver =
      function() {
        if (this.nrtvServer.__isInfectedWithNrtvSockets) {
          return
        }

        socket = sockjs.createServer()

        var app = this.nrtvServer.express()

        var httpServer = http.createServer(app);

        socket.installHandlers(httpServer, {prefix: "/echo"})

        this.adopters.push(function(conn) {
          throw new Error("unadopted conn!")
        })

        this.nrtvServer.relenquishControl(
          function start(port) {
            httpServer.listen(port)
            console.log("listening on "+port+" (for websockets too)")
            return httpServer
          })

        socket.on("connection", this._handleNewConnection.bind(this))

        this.nrtvServer.__isInfectedWithNrtvSockets = true
      }

    SocketServer.prototype._handleNewConnection =
      function(connection) {
        var adopters = this.adopters

        var i = adopters.length - 1

        tryAnother()

        function tryAnother() {
          var adopter = adopters[i--]

          if (adopter) {
            adopter(connection, tryAnother)
          }
        }
      }

    return SocketServer
  }  
)