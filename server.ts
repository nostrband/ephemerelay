import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { EventEmitter } from 'https://deno.land/x/event@2.0.1/mod.ts';
import { Event, Filter, matchFilter, validateEvent, verifySignature } from 'npm:nostr-tools@^1.7.4';

type RelayMsg = ['EVENT', Event] | ['REQ', string, Filter] | ['CLOSE', string];
type Listener = (event: Event) => void;

const emitter = new EventEmitter<{ event: [Event] }>(0);

function connectStream(socket: WebSocket): void {
  const subs = new Map<string, Listener>();

  socket.onmessage = (e) => {
    const msg: RelayMsg = JSON.parse(e.data);
    console.log('Got message', msg);

    switch (msg[0]) {
      case 'EVENT':
        handleEvent(msg[1]);
        return;
      case 'REQ':
        handleReq(msg[1], msg[2]);
        return;
      case 'CLOSE':
        handleClose(msg[1]);
        return;
    }

    function handleEvent(event: Event) {
      if (validateEvent(event) && verifySignature(event)) {
        emitter.emit('event', event);
        socket.send(JSON.stringify(['OK', event.id, true, '']));
      } else {
        socket.send(JSON.stringify(['OK', event.id, false, 'invalid: invalid']));
      }
    }

    function handleReq(sub: string, filter: Filter) {
      socket.send(JSON.stringify(['EOSE', sub]));

      const listener: Listener = (event) => {
        if (matchFilter(filter, event)) {
          socket.send(JSON.stringify(['EVENT', sub, event]));
        }
      };

      subs.set(sub, listener);
      emitter.on('event', listener);
    }

    function handleClose(sub: string) {
      const listener = subs.get(sub);
      if (listener) {
        emitter.off('event', listener);
      }
      subs.delete(sub);
    }
  };

  socket.onclose = () => {
    subs.forEach((listener) => {
      emitter.off('event', listener);
    });
    subs.clear();
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
