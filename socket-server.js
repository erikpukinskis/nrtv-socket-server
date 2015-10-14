var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-socket-server",
  [library.collective({}), "sockjs", "nrtv-server", "http", "nrtv-browser-bridge"],
  function(collective, sockjs, nrtvServer, http, bridge) {

    function SocketServer() {
      this.socket = sockjs.createServer()

      var middlewares = this.middlewares = []

      var app = nrtvServer.express()

      var httpServer = http.createServer(app);

      this.socket.installHandlers(httpServer, {prefix: "/echo"})

      this.adopters = []

      this.adoptConnections(
        function(connection) {
          console.log("unadopted conn!")
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

    SocketServer.prototype.defineInBrowser = function() {
        return bridge.defineFunction(
          [bridge.collective({})],
          getSocketInBrowser
        )
      }

    function getSocketInBrowser(collective, callback, queryString) {

      var url = "ws://"+window.location.host+"/echo/websocket"+(queryString || "")

      if (!collective[url]) {
        collective[url] = {callbacks: []}
      }
      collective = collective[url]

      if (collective.open) {
        return callback(collective.socket)
      }

      collective.callbacks.push(callback)

      if (collective.socket) {
        return
      }

      var socket = collective.socket = new WebSocket(url)

      socket.onopen = function () {
        collective.open = true
        collective.callbacks.forEach(
          function(callback) {
            callback(socket)
          }
        )
      }

    }


    library.collectivize(
      SocketServer,
      collective,
      ["adoptConnections", "defineInBrowser"]
    )
    return SocketServer
  }  
)