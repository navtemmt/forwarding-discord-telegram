const { Telegraf } = require("telegraf");
const Discord = require("discord.js-selfbot-v13");
const config = require("../config.json");
const dotenv = require("dotenv");

// Import tokens
(async () => {
	if (process.env.NODE_ENV != "production") {
		await dotenv.config();
	}
})();

const client = new Discord.Client({
	checkUpdate: false
});
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

global.tempText = "";

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

const formatSize = (length) => {
	let i = 0;
	const type = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

	while ((length / 1000) | 0 && i < type.length - 1) {
		length /= 1024;

		i++;
	}

	return length.toFixed(2) + " " + type[i];
};

client.on("messageCreate", (message) => {
	if (
		config.mutedChannelsIds != undefined &&
		config.mutedChannelsIds?.length != 0 &&
		(config.mutedChannelsIds?.includes(message.channel.id) ||
			config.mutedChannelsIds?.includes(Number(message.channel.id)))
	)
		return;

	if (
		config.allowedChannelsIds != undefined &&
		config.allowedChannelsIds?.length != 0 &&
		!config.allowedChannelsIds?.includes(message.channel.id) &&
		!config.allowedChannelsIds?.includes(Number(message.channel.id))
	)
		return;

	if (
		config.mutedUsersIds != undefined &&
		config.mutedUsersIds?.length != 0 &&
		(config.mutedUsersIds?.includes(message.author.id) ||
			config.mutedUsersIds?.includes(Number(message.author.id)))
	)
		return;

	if (
		config.allowedUsersIds != undefined &&
		config.allowedUsersIds?.length != 0 &&
		!config.allowedUsersIds?.includes(message.author.id) &&
		!config.allowedUsersIds?.includes(Number(message.author.id))
	)
		return;

	if (
		config.channelConfigs[message.channel.id] != undefined &&
		config.channelConfigs[message.channel.id]?.allowed != undefined &&
		config.channelConfigs[message.channel.id]?.allowed?.length != 0 &&
		!config.channelConfigs[message.channel.id]?.allowed?.includes(
			message.author.id
		) &&
		!config.channelConfigs[message.channel.id]?.allowed?.includes(
			Number(message.author.id)
		)
	)
		return;

	if (
		config.channelConfigs[message.channel.id] != undefined &&
		config.channelConfigs[message.channel.id]?.muted != undefined &&
		config.channelConfigs[message.channel.id]?.muted?.length != 0 &&
		(config.channelConfigs[message.channel.id]?.muted?.includes(
			message.author.id
		) ||
			config.channelConfigs[message.channel.id]?.muted?.includes(
				Number(message.author.id)
			))
	)
		return;

	const date = new Date().toLocaleString("en-US", {
		day: "2-digit",
		year: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});

	let render = "";

	if (config.showDate) render += `[${date}] `;

	if (config.showChat)
		render += message.guild
			? `[${message.guild.name} / ${message.channel.name} / ${message.author.tag}]: `
			: `[${message.author.tag}]: `;

	render += message.content;

	let allEmbeds = [];

	message.embeds.forEach((embed) => {
		let stringEmbed = "Embed:\n";

		if (embed.title) stringEmbed += `  Title: ${embed.title}\n`;
		if (embed.description)
			stringEmbed += `  Description: ${embed.description}\n`;
		if (embed.url) stringEmbed += `  Url: ${embed.url}\n`;
		if (embed.color) stringEmbed += `  Color: ${embed.color}\n`;
		if (embed.timestamp) stringEmbed += `  Url: ${embed.timestamp}\n`;

		let allFields = ["  Fields:\n"];

		embed.fields.forEach((field) => {
			let stringField = "    Field:\n";

			if (field.name) stringField += `      Name: ${field.name}\n`;
			if (field.value) stringField += `      Value: ${field.value}\n`;

			allFields = [...allFields, stringField];
		});

		if (allFields.length != 1) stringEmbed += `${allFields.join("")}`;
		if (embed.thumbnail) stringEmbed += `  Thumbnail: ${embed.thumbnail.url}\n`;
		if (embed.image) stringEmbed += `  Image: ${embed.image.url}\n`;
		if (embed.video) stringEmbed += `  Video: ${embed.video.url}\n`;
		if (embed.author) stringEmbed += `  Author: ${embed.author.name}\n`;
		if (embed.footer) stringEmbed += `  Footer: ${embed.footer.iconURL}\n`;

		allEmbeds = [...allEmbeds, stringEmbed];
	});

	if (allEmbeds.length != 0) render += allEmbeds.join("");

	let allAttachments = [];

	message.attachments.forEach((attachment) => {
		allAttachments = [
			...allAttachments,
			`Attachment:\n  Name: ${attachment.name}\n${
				attachment.description ? `	Description: ${attachment.description}\n` : ""
			}  Size: ${formatSize(attachment.size)}\n  Url: ${attachment.url}`
		];
	});

	if (allAttachments.length != 0) render += allAttachments.join("");

	console.log(render);

	if (config.stackMessages) return global.tempText += `${render}\n\n`;

	sendData(render);
});

bot.catch((err) => {
	console.log(err);
});

const sendData = (text) => {
	try {
		if (text != "")
			bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, text);
	} catch (e) {
		console.error("Bot crushed!");
	}
};

if (config.stackMessages)
	setInterval(() => {
		sendData(global.tempText);

		global.tempText = "";
	}, 5000);

client.login(process.env.DISCORD_TOKEN);
