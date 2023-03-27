# Ephemerelay

A Nostr relay that doesn't care about the past.

Ephemerelay is a Nostr relay implemented in less than 100 lines of code. It immediately sends an [`EOSE`](https://github.com/nostr-protocol/nips/blob/master/15.md) for any filter, and then begins returning new events that match. Submitting an event works similarly - it will only be distributed to clients currently connected on that filter.

## Why?

Clients and relays are like the circles and squares of the Nostr protocol - the most basic shapes. But even more primordial than a square is a right-triangle. The ephemeral relay is the inferior sibling of the relay. It is part of the greater Nostr story, and it WANTS to exist.

There are all kinds of possibilities for complex networking setups with Nostr. An ephemeral relay can transmit data to clients, who can in turn transmit events to fully-qualified relays that actually store things. Alternatively, you can just use it to chat with your friends who are online.

The biggest benefit is not caring about storage space, not caring about spam, and not caring about cost. At least not in this context. That's someone else's job.

## Tech stack

- TypeScript
- Deno
- NoDB (it's like NoSQL except there isn't a database)

## Features

- Less than 100 lines of code
- Supports NIP-01, NIP-15, and NIP-20
- There isn't a database

## License

This is free and unencumbered software released into the public domain.
