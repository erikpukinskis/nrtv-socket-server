var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-socket-server",
  [library.collective({}), "sockjs", "nrtv-server", "http", "querystring"],
  function(collective, sockjs, nrtvServer, http) {

    function SocketServer() {
      this.socket = sockjs.createServer()

      var middlewares = this.middlewares = []

      var app = nrtvServer.express()

      var httpServer = http.createServer(app);

      this.socket.installHandlers(httpServer, {prefix: "/echo"})

      this.adopters = []

      this.adoptConnections(
        function(connection) {
          console.log("unadopted:", message)
        }
      )

      nrtvServer.relenquishControl(
        function start(port) {
          httpServer.listen(port)
          console.log("listening on "+port+" (for websockets too)")
          return httpServer
        })

      var socketServer = this

      this.socket.on("connection", this.handleNewConnection.bind(this))
    }

    SocketServer.prototype.adoptConnections =
      function(handler) {
        this.adopters.push(handler)
      }

    SocketServer.prototype.handleNewConnection =
      function(conn) {

        var adopters = this.adopters

        var i = adopters.length - 1

        tryAnother()

        function tryAnother() {
          var adopter = adopters[i--]

          if (adopter) {
            adopter(conn, tryAnother)
          }
        }
      }

    library.collectivize(
      SocketServer,
      collective,
      ["adoptConnections"]
    )
    return SocketServer
  }  
)