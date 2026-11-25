const net = await import('node:net');
const socket = net.createConnection({host: '127.0.0.1', port: 6379, timeout: 10000}, () => {
  console.log('connected');
  let i = 0;
  const interval = setInterval(() => {
    if (++i > 10) { clearInterval(interval); socket.end(); return; }
    socket.write('*1\r\n$4\r\nPING\r\n');
    console.log('sent ping', i);
  }, 500);
});
socket.on('data', (data) => console.log('recv:', data.toString().trim()));
socket.on('error', (err) => console.log('error:', err.code, err.message));
socket.on('close', (hadError) => console.log('close, hadError:', hadError));
