import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';

serve((req) => {
  const upgrade = req.headers.get('upgrade') || '';

  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Please use a Nostr client to connect.');
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => console.log('socket opened');

  socket.onmessage = (e) => {
    console.log('socket message:', e.data);
    socket.send(new Date().toString());
  };

  socket.onerror = (e) => console.log('socket errored:', e);
  socket.onclose = () => console.log('socket closed');

  return response;
}, {
  port: 5000,
});
