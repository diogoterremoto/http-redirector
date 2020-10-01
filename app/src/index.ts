import * as express from "express";
import * as _ from "lodash"
import * as pathToRegexp from "path-to-regexp"
import * as fs from "fs"

import { Redirect } from "./redirect.interface"

// Get configuration from environment variable or local `redirects.json` file
const REDIRECTS: Redirect[] = JSON.parse(process.env.REDIRECTS || fs.existsSync("redirects.json") && fs.readFileSync("redirects.json", "utf8"));
const PORT = process.env.PORT || 8080;

// Create express server
const app = express();

// Run `redirect` function on all routes
app.get("*", (req: express.Request, res: express.Response) => {
	log("Request received.")
	redirect(req, res)
});

// This will tell Express to to determine the connection and the IP address of the client
// via X-Forwarded-* headers, usually needed when it's behind a front-facing proxy.
app.enable("trust proxy");

// Start the express server
app.listen(PORT, () => {
	log(`Server started at http://localhost:${PORT}`);
});

/**
 * Make the redirect.
 */
function redirect(req: express.Request, res: express.Response) {

	log("Going to evaluate the request.")

	const pathUrl = req.originalUrl;
	const fullUrl = req.protocol + "://" + req.get("host") + pathUrl;

	log (`Request URL is: ${fullUrl}`);

	// Find redirect entry
	const redirectEntry: Redirect = _.find(REDIRECTS, (item) =>
		!!(pathToRegexp(item.source).exec(fullUrl) || pathToRegexp(item.source).exec(pathUrl)));


	// Redirect to destination if found
	if (redirectEntry) {
		log(`Found redirect entry: ${JSON.stringify(redirectEntry)}`);

		// Evaluate what URL segment to match.
		// If the redirect declaration source is a valid HTTP URL, the request full URL should be used.
		const urlSegmentToMatch = isValidHttpUrl(redirectEntry.source) ? fullUrl : pathUrl;
		const destination = getDestination(redirectEntry, urlSegmentToMatch);

		log(`Calculated destination is: ${destination}`);

		if (!redirectEntry.cache) {
			setNoCacheHeaders(res);
		}

		res.redirect(redirectEntry.type || 302, destination || "/");
	} else {
		log ("No redirect entry was found. Sending 404.");
		res.status(404).send("No redirect entry was found.")
	}
}

/**
 * To always hit this function, never cache the response by using the following headers.
 */
function setNoCacheHeaders(res: express.Response) {
	res.setHeader("Expires", "0");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0, max-stale=0, post-check=0, pre-check=0");
	res.setHeader("Surrogate-Control", "private, no-cache, no-store, must-revalidate, max-age=0, max-stale=0, post-check=0, pre-check=0");
	res.setHeader("Vary", "*");
}

/**
 * Compute destination path with source and request URL.
 */
function getDestination(redirectEntry: Redirect, requestUrl: any): string {
	const sourceKeys = [];

	const sourceMatch = pathToRegexp(redirectEntry.source, sourceKeys).exec(requestUrl);

	let destination;

	if (sourceMatch) {
		const capturedFragments = [...sourceMatch].splice(1); // Remove the first result because it's unnecessary.

		// Create map with fragment keys and values
		const map = {};
		sourceKeys.forEach((key, i) => map[key.name] = capturedFragments[i]);

		// Create destination
		destination = pathToRegexp.compile(redirectEntry.destination)(map);
	} else {
		destination = redirectEntry.destination;
	}

	return decodeURIComponent(destination);
}

/**
 * Evaluate whenever the specified string is a valid HTTP URL.
 */
function isValidHttpUrl(string: string) {
	let url: URL;

	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}

	return url.protocol === "http:" || url.protocol === "https:";
}

function log(...args) {
	if (process.env.LOG) {
		console.log(...args)
	}
}
