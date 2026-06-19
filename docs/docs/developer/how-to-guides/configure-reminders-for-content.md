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

This project uses crazymax/swarm-cronjob to handle periodic background tasks (cron jobs) natively within our Docker Swarm cluster.

Instead of running an external cron daemon, we deploy a lightweight manager agent that uses Docker Service Labels to scale background worker containers up and down on a schedule.

## Architecture Overview

- `swarm-cronjob`: Runs 24/7 **strictly** on a Swarm Manager Node. It binds to the host's `/var/run/docker.sock` to listen to the Docker Swarm API.
- `backend-cron-worker`: Sits dormant at `replicas: 0`. When the cron expression triggers, the agent temporarily scales it to `replicas: 1`. Once the script finishes executing, the container exits cleanly and returns to 0 replicas.

### The swarm-cronjob Service

This service must run on a Manager Node within your cluster. You do not need to include or run this service within every stack in your cluster; a single instance manages schedules cluster-wide across all stacks.

```yaml
services:
  swarm-cronjob:
    image: crazymax/swarm-cronjob:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # Allows the agent to control Swarm scaling
    environment:
      - "TZ=Europe/Berlin"
      - "LOG_LEVEL=info"
      - "LOG_JSON=false"
    deploy:
      placement:
        constraints:
          - node.role == manager # Mandatory: Worker nodes cannot access global cluster APIs
```

For more information about configuring this agent, please refer to the official [installation documentation](https://crazymax.dev/swarm-cronjob/install/docker/).

### The backend-cron-worker Service

This service should live inside your application's stack. It must use the same base image as your main `backend` and share the identical environment configuration (e.g., database connections) to keep states synchronized.

```yaml
services:
  # ... your live application services (frontend, backend, db, etc.) ...

  backend-cron-worker:
    image: your-backend-image:version
    command: ./docker-entrypoint.sh run scripts/review_reminder.py
    environment:
      ZEO_ADDRESS: "${STACK_NAME}_zeo:8100"
    deploy:
      mode: replicated
      replicas: 0                          # CRITICAL: Must start at 0 so it only runs on-demand
      restart_policy:
        condition: none                    # CRITICAL: Stops Swarm from restarting the job when it exits cleanly
      labels:
        - "swarm.cronjob.enable=true"
        - "swarm.cronjob.schedule=0 0 * * *"  # Standard Cron Expression (Every day at 00:00 midnight)
        - "swarm.cronjob.skip-running=false"
```

For more information on available service labels, please refer to the official [usage documentation](https://crazymax.dev/swarm-cronjob/usage/get-started/).
