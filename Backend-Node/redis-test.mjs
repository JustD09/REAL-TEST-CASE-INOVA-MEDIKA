const net = await import('node:net');
for (const host of ['127.0.0.1', '172.31.228.79']) {
  await new Promise((resolve) => {
    const socket = net.createConnection({host, port: 6379, timeout: 3000}, () => {
      console.log(host, 'connected');
      socket.write('*1\r\n$4\r\nPING\r\n');
    });
    socket.on('data', (data) => { console.log(host, data.toString().trim()); socket.destroy(); });
    socket.on('timeout', () => { console.log(host, 'timeout'); socket.destroy(); });
    socket.on('error', (err) => { console.log(host, err.code, err.message); resolve(); });
    socket.on('close', () => resolve());
  });
}
