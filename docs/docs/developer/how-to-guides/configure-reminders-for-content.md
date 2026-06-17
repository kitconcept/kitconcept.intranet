---
doc_type: how-to
audience: developer
myst:
  html_meta:
    "description": "Reminders for potentially outdated content"
    "keywords": "Reminders, CLM, content livecycle management, automation, docker, docker swarm"
last_updated: 2026-06-17
---

# Configure reminders for potentially outdated content

```{versionadded} 2.0.0-alpha.x
```

This project uses [`crazymax/swarm-cronjob`](https://github.com/crazy-max/swarm-cronjob) to handle periodic background tasks (cron jobs) natively within our Docker Swarm cluster.

Instead of running an external cron daemon, we deploy a lightweight manager agent that uses Docker Service Labels to scale background worker containers up and down on a schedule.

## Architecture Overview

- `swarn-cronjob`: Runs 24/7 **strictly** on a Manager Node. It binds to `/var/run/docker.sock` to listen to the Swarm API.
- `backend-cron-worker`: Sits dormant at `replicas: 0`. When the cron expression triggers, the agent scales it to `replicas: 1`. Once the script finishes, the container exits and returns to 0 replicas.

## Configuration

Add this alongside your existing services in your docker compose file (e.g. `docker-compose.yml`). For more information please refer to the official documentation [here](https://crazymax.dev/swarm-cronjob/):

```yaml
services:
  swarm-cronjob:
    image: crazymax/swarm-cronjob:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - "TZ=Europe/Paris"
      - "LOG_LEVEL=info"
      - "LOG_JSON=false"
    deploy:
      placement:
        constraints:
          - node.role == manager

  backend-cron-worker:
    image: your-backend-image:version
    command: ./docker-entrypoint.sh run scripts/review_reminder.py
    environment:
      RELSTORAGE_DSN: true
    deploy:
      mode: replicated
      replicas: 0
      labels:
        - "swarm.cronjob.enable=true"
        - "swarm.cronjob.schedule=0 0 * * *"  # Standard Cron Expression (e.g., Every day at 00:00 AM)
        - "swarm.cronjob.skip-running=false"
      restart_policy:
        condition: none
```
