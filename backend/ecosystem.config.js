module.exports = {
  apps: [
    {
      name: 'audit-backend',
      script: 'dist/main.js',
      instances: 'max',       // 使用所有 CPU 核心
      exec_mode: 'cluster',   // cluster 模式
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
