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
          return true
        },
        function(message) {
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

    function ConnectionAdopter(doesWantIt, handler) {
      this.wants = doesWantIt
      this.handler = handler
      this.connections = {}
    }

    ConnectionAdopter.prototype.addConnection =
      function(conn) {
        var connections = this.connections

        connections[conn.id] = conn

        conn.on("close", function() {
          delete connections[conn.id]
        })

        var handler = this.handler

        conn.on("data", function(message) {

          handler(message)
        })
      }

    SocketServer.prototype.adoptConnections =
      function(doesWantIt, handler) {
        var adopter = new ConnectionAdopter(doesWantIt, handler)

        this.adopters.push(adopter)

        return adopter
      }

    SocketServer.prototype.handleNewConnection =
      function(conn) {

        var adopters = this.adopters
        var orphanConnections = this.orphanConnections

        tryAdopter(adopters.length - 1)

        function tryAdopter(i) {
          var adopter = adopters[i]

          if (!adopter) {
            return
          } else if (adopter.wants(conn)) {

            adopter.addConnection(conn)

          } else {
            tryAdopter(i - 1)
          }
        }
      }

    return SocketServer
  }  
)