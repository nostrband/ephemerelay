# Ephemerelay

A Nostr relay that doesn't care about the past.

Ephemerelay is a Nostr relay implemented in about 100 lines of code. It immediately sends an [`EOSE`](https://github.com/nostr-protocol/nips/blob/master/15.md) for any filter, and then begins returning new events that match. Submitting an event works similarly - it will only be distributed to clients currently connected on that filter.

## Why?

Clients and relays are like the circles and squares of the Nostr protocol - the most basic shapes. But even more primordial than a square is a right-triangle. The ephemeral relay is the inferior sibling of the relay. It is part of the greater Nostr story, and it WANTS to exist.

There are all kinds of possibilities for complex networking setups with Nostr. An ephemeral relay can transmit data to clients, who can in turn transmit events to fully-qualified relays that actually store things. Alternatively, you can just use it to chat with your friends who are online.

The biggest benefit is not caring about storage space, not caring about spam, and not caring about cost. At least not in this context. That's someone else's job.

## Tech stack

- TypeScript
- Deno
- NoDB (it's like NoSQL except there's no database)

## Features

- About 100 lines of code
- Supports NIP-01, NIP-15, and NIP-20
- There isn't a database

## Local development

```sh
# Install Deno
sudo apt install -y unzip
curl -fsSL https://deno.land/install.sh | sh

# Clone repo
git clone https://gitlab.com/soapbox-pub/ephemerelay.git
cd ephemerelay

# Run server
deno task dev
```

## Installation in prod

```sh
# Install Deno globally
sudo apt install -y unzip
curl -fsSL https://deno.land/x/install/install.sh | sudo DENO_INSTALL=/usr/local sh

# Clone repo
git clone https://gitlab.com/soapbox-pub/ephemerelay.git /opt/ephemerelay

# Add systemd unit
cp /opt/ephemerelay/installation/ephemerelay.service /etc/systemd/system/

# Edit systemd unit and change the `User` and `WorkingDirectory` as needed
nano /etc/systemd/system/ephemerelay.service

# Start Ephemerelay
systemctl enable --now ephemerelay

# Install nginx
sudo apt install -y nginx

# Copy nginx config
cp /opt/ephemerelay/installation/ephemerelay.conf /etc/nginx/sites-enabled/

# Edit nginx config as needed
nano /etc/nginx/sites-enabled/ephemerelay.conf

# Reload nginx
systemctl reload nignx
```

## License

This is free and unencumbered software released into the public domain.
