module.exports = {
  apps : [
    {
      name: "Unilance.co.uk",
      script: './bin/www',
      autorestart: true,
      watch: true,
      instances : "max",
      exec_mode : "cluster",
      "env_development": {
        "NODE_ENV"     : "development"
      },
      "env_production" : {
        "NODE_ENV"     : "production",
      },
    }
  ]
};
