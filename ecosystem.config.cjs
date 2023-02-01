module.exports = {
    apps : [
        {
          name: "elastic-dump",
          script: "./index.js",
          exec_mode: "fork",
          watch: false,
          interpreter: "/home/durlabh/.nvm/versions/node/v16.19.0/bin/node",
          env: {
              "NODE_TLS_REJECT_UNAUTHORIZED": "0"
          }
        }
    ]
  }