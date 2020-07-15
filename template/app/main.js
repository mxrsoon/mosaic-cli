import { Application } from "@mosaic/core/index.js";
import { View } from "@mosaic/core/index.js";
import { AppBar, Text } from "@mosaic/widgets/index.js";

export const app = new Application({
	view: new View({
		children: [
			new AppBar(),

			new Text({
				id: "cardText",
				x: 0,
				y: 72,
				width: "100%",
				height: 480,
				padding: 16,
				
				text: "Hello, world! Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas possimus quibusdam magni suscipit incidunt voluptates ut ab doloribus provident illo, perferendis autem eos obcaecati quod! Necessitatibus iusto maiores rem nulla."
			}),
		]
	})
});