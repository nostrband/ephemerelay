import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { EventEmitter } from 'https://deno.land/x/event@2.0.1/mod.ts';
import { matchFilters, verifySignature } from 'npm:nostr-tools@^1.7.4';
import { z } from 'https://deno.land/x/zod@v3.20.5/mod.ts';

type Event = z.infer<typeof eventSchema>;
type Filter = z.infer<typeof filterSchema>;
type Listener = (event: Event) => void;

const emitter = new EventEmitter<{ event: [Event] }>(0);

function connectStream(socket: WebSocket): void {
  const subs = new Map<string, Listener>();

  socket.onmessage = (e) => {
    console.log('msg', e.data);
    const json = jsonSchema.safeParse(e.data);
    const parsed = json.success ? relayMsgSchema.safeParse(json.data) : undefined;
    const msg = parsed?.success ? parsed.data : undefined;

    if (!msg) {
      socket.send(JSON.stringify(['NOTICE', 'invalid: failed to parse message']));
      return;
    }

    switch (msg[0]) {
      case 'EVENT':
        handleEvent(msg[1]);
        return;
      case 'REQ':
        handleReq(msg[1], msg.slice(2));
        return;
      case 'CLOSE':
        handleClose(msg[1]);
        return;
    }

    function handleEvent(event: Event) {
      emitter.emit('event', event);
      socket.send(JSON.stringify(['OK', event.id, true, '']));
    }

    function handleReq(sub: string, filters: Filter[]) {
      socket.send(JSON.stringify(['EOSE', sub]));

      const listener: Listener = (event) => {
        if (matchFilters(filters, event)) {
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

const jsonSchema = z.string().transform((value, ctx) => {
  try {
    return JSON.parse(value);
  } catch (_e) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON' });
    return z.NEVER;
  }
});

const filterSchema = z.object({
  ids: z.array(z.string()).optional(),
  kinds: z.array(z.number()).optional(),
  authors: z.array(z.string()).optional(),
  since: z.number().optional(),
  until: z.number().optional(),
  limit: z.number().optional(),
}).passthrough();

const eventSchema = z.object({
  id: z.string(),
  kind: z.number(),
  pubkey: z.string(),
  content: z.string(),
  tags: z.array(z.array(z.string())),
  created_at: z.number(),
  sig: z.string(),
}).refine((event) => verifySignature(event));

const relayMsgSchema = z.union([
  z.tuple([z.literal('EVENT'), eventSchema]),
  z.tuple([z.literal('REQ'), z.string()]).rest(filterSchema),
  z.tuple([z.literal('CLOSE'), z.string()]),
]);

serve(handleRequest, { port: 5000 });
