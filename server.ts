import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { Event, Filter } from 'npm:nostr-tools@^1.7.4';

type RelayMsg = ['EVENT', Event] | ['REQ', string, Filter] | ['CLOSE', string];

function connectStream(socket: WebSocket): void {
  const subs = new Map<string, Filter>();

  socket.onmessage = (e) => {
    const msg: RelayMsg = JSON.parse(e.data);
    console.log('Got message', msg);

    switch (msg[0]) {
      case 'EVENT':
        return;
      case 'REQ':
        socket.send(JSON.stringify(['EOSE', msg[1]]));
        return;
      case 'CLOSE':
        subs.delete(msg[1]);
        return;
    }
  };
}

function handleRequest(req: Request): Response {
  const upgrade = req.headers.get('upgrade') || '';

  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Please use a Nostr client to connect.');
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  connectStream(socket);
  return response;
}

serve(handleRequest, { port: 5000 });
