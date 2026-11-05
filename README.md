# crafty-world-picker

A simple, kid-friendly web UI on top of [Crafty Controller](https://gitlab.com/crafty-controller/crafty-4) for picking which Minecraft world the server runs.

I built this for my kids. When friends come over to play, they want to jump into a world quickly, and Crafty's full admin panel is a lot to handle for that. Here they see their worlds as cards, tap Start on the one they want, and can create a new world with a name, game mode and difficulty. Crafty handles the rest.

It is also my hands-on project for learning Angular: standalone components, signals, `httpResource` and Signal Forms, built step by step using Angular's AI Tutor with Claude.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.5.

## Deployment

Docker, Docker Compose (with Crafty) and LXC/nginx: see [deploy/README.md](deploy/README.md).

## Prerequisites

The project uses [Bun](https://bun.sh) (1.4.4, pinned in `package.json`) as package manager and script runner. Install dependencies with:

```bash
bun install
```

Run Angular CLI commands with `bunx ng <command>`.

## Development server

Copy `.env.example` to `.env` and fill in the Crafty connection, then run:

```bash
bun run start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

```bash
bun run build
```

This compiles the app into `dist/crafty-world-picker/browser/`. By default, the production build optimizes the app for performance and speed.

## Running unit tests

Unit tests use the [Vitest](https://vitest.dev/) runner:

```bash
bun run test         # run once
bun run test:watch   # rerun on changes
```

## Linting and formatting

```bash
bun run lint            # oxlint
bun run format          # prettier --write
bun run format:check    # prettier --check
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
