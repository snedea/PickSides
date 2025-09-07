module.exports = {
  apps: [{
    name: 'picksides',
    script: 'npm',
    args: 'start',
    cwd: '/home/chuck/homelab/picksides',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 1600,
    restart_delay: 100,
    min_uptime: '10s',
    max_restarts: 10
  }]
}