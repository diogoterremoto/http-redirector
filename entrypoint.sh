#!/bin/sh

# Default environment to production if not set
if [ -z ${ENV+x} ]; then
	ENV=production
fi

echo "Environment: $ENV"

# Evaluate script to run
if [ -z "$@" ]; then
	echo "Because no command was passed, going to evaluate which command to run based on environment."

	if [ $ENV = "production" ]; then
		SCRIPT="serve"
	else
		SCRIPT="dev"
	fi
else
	# Run the argumented command
	SCRIPT=$@
fi

# Set default port
if [ -z "$PORT" ]; then
	PORT=8080
fi

# Run NPM script (defined in package.json)
echo "Going to run '$SCRIPT'…"
exec npm run $SCRIPT -- --port $PORT
