#!/usr/bin/env node

import path from "path";
import fs from "fs-extra";
import url from "url";
import minimist from "minimist";
import mosaicWeb from "mosaic-web";
import SoftError from "./soft-error.mjs";

const platforms = {
	web: mosaicWeb
};

async function platform(args) {
    if (args.length > 0) {
		switch (args[0]) {
			case "add": {
				await platformAdd(args.slice(1));
			} break;

			default: {
				throw new SoftError("Unknown command");
			} break;
		}
	} else {
		throw new SoftError("You must specify a command");
	}
}

async function platformAdd(args) {
	if (args.length > 0) {
		const platform = args[0].toLowerCase();
		const manifestPath = path.resolve(process.cwd(), "mosaic.json");
		let manifest;

		try {
			manifest = await fs.readJSON(manifestPath, { throws: true });
		} catch (e) {
			throw new SoftError("Unable to read mosaic.json in the current working directory");
		}

		if (platform in platforms) {
			if (!manifest.platforms.includes(platform)) {
				manifest.platforms.push(platform);
			}

			await fs.writeJSON(manifestPath, manifest, { spaces: "\t" });
			console.log(`Platform '${platform}' added`);
		} else {
			throw new SoftError("Unknown platform");
		}
	} else {
		throw new SoftError("You must specify a platform to add");
	}
}

async function build(args) {
	let manifest;
	const manifestPath = path.resolve(process.cwd(), "mosaic.json");

	try {
		manifest = await fs.readJSON(manifestPath, { throws: true });
	} catch (e) {
		throw new SoftError("Unable to read mosaic.json in the current working directory");
	}

	let platformsToBuild = [];

    if (args.length > 0) {
		const platform = args[0].toLowerCase();

		if (manifest.platforms.includes(platform)) {
			platformsToBuild.push(platform);
		} else {
			throw new SoftError("Platform not added to the project, use 'mosaic platform add <platform_name>' to add it");
		}
	} else {
		platformsToBuild = manifest.platforms;
	}

	const appPath = path.resolve(process.cwd(), "app");
	const mosaicPath = path.resolve(process.cwd(), "mosaic");
	const libPath = path.resolve(process.cwd(), "lib");

	for (let platform of platformsToBuild) {
		platform = platform.toLowerCase().trim();

		if (platform in platforms) {
			const outputPath = await platforms[platform].build({
				out: path.resolve(process.cwd(), "out", platform),
				app: appPath,
				mosaic: mosaicPath,
				lib: libPath,
				manifest: manifest
			});

			console.log(`Built for platform '${platform}' at '${outputPath}'`);
		} else {
			throw new SoftError(`Unknown platform '${platform}'`);
		}
	}
}

async function create(args) {
	if (args.length > 0) {
		const outDir = path.resolve(process.cwd(), args[0]);
		const manifestDir = path.resolve(outDir, "mosaic.json");
		const templateDir = path.resolve(url.fileURLToPath(path.dirname(import.meta.url)), "template");
		const name = path.basename(outDir);
		
		await fs.ensureDir(outDir);
		const files = await fs.readdir(outDir);

		if (files.length > 0) {
			throw new SoftError("Target directory must be empty");
		} else {
			await fs.copy(templateDir, outDir);
			await fs.writeJSON(manifestDir, generateManifest(name), { spaces: "\t" });
			console.log(`Succesfully created '${name}' project at '${outDir}'`);
		}
	} else {
		throw new SoftError("You must specify a target directory");
	}
}

async function run(args) {
	if (args.length > 0) {
		const platform = args[0].toLowerCase();

		let manifest;
		const manifestPath = path.resolve(process.cwd(), "mosaic.json");

		try {
			manifest = await fs.readJSON(manifestPath, { throws: true });
		} catch (e) {
			throw new SoftError("Unable to read mosaic.json in the current working directory");
		}

		if (!(platform in platforms)) {
			throw new SoftError(`Unknown platform '${platform}'`);
		}

		if (!manifest.platforms.includes(platform)) {
			throw new SoftError("Platform not added to the project, use 'mosaic platform add <platform_name>' to add it");
		}

		const outPath = path.resolve(process.cwd(), "out", platform);
		let outItems;

		try {
			outItems = await fs.readdir(outPath);
		} catch (e) {
			throw new SoftError("Couldn't read output directory. Did you forget to build for the platform?");
		}

		if (outItems.length === 0) {
			throw new SoftError("Output directory is empty. Did you forget to build for the platform?");
		}

		await platforms[platform].run({
			out: outDir,
			manifest: manifest
		});
	} else {
		throw new SoftError("You must specify a platform to run");
	}
}

function generateManifest(name) {
	return {
		name: name,
		platforms: [],
		dependencies: {}
	}
}

async function main() {
	const args = minimist(process.argv.slice(2))["_"];

	try {
		if (args.length > 0) {
			switch (args[0]) {
				case "create": {
					await create(args.slice(1));
				} break;

				case "platform":
				case "plat": {
					await platform(args.slice(1));
				} break;

				case "build": {
					await build(args.slice(1));
				} break;

				case "run": {
					await run(args.slice(1));
				} break;
			}
		} else {
			throw new SoftError("You must specify a command");
		}
	} catch (e) {
		if (e instanceof SoftError) {
			console.error(e.message);
		} else {
			throw e;
		}
	}
}

main();