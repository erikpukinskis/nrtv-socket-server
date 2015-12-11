var library = require("nrtv-library")(require)

var toot

module.exports = library.export(
  "nrtv-socket-server",
  [library.collective({}), "sockjs", "nrtv-server", "http"],
  function(collective, sockjs, nrtvServer, http) {

    function SocketServer(server) {
      if (!server) {
        server = nrtvServer
      }

      var socketServer = server.__nrtvSocketServer

      if (socketServer) {
        throw new Error("The server already has a socket server associated with it. Do you want to do SocketServer.onServer(yourServer) instead? You can call that as many times as you want.")
      }

      this.adopters = []
      this._takeOver(server)
    }

    SocketServer.onServer =
      function(server) {
        var socketServer = server.__nrtvSocketServer

        if (!socketServer) {
          socketServer = server.__nrtvSocketServer = new SocketServer(server)
        }

        return socketServer
      }

    SocketServer.prototype.use =
      function(handler) {
        this.adopters.push(handler)
      }

    SocketServer.prototype._takeOver =
      function(server) {
        server.__nrtvSocketServer = this

        sockjsServer = sockjs.createServer()

        var app = server.express()

        var httpServer = http.createServer(app);

        sockjsServer.installHandlers(httpServer, {prefix: "/echo"})

        this.adopters.push(function(conn) {
          throw new Error("unadopted conn!")
        })

        server.relenquishControl(
          function start(port) {
            httpServer.listen(port)
            console.log("listening on "+port+" (for websockets too)")
            return httpServer
          })

        sockjsServer.on("connection", this._handleNewConnection.bind(this))
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

    library.collectivize(
      SocketServer,
      collective,
      function() {
        return SocketServer.onServer(nrtvServer)
      },
      ["use"]
    )

    return SocketServer
  }  
)