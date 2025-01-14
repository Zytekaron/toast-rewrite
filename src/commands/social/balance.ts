import Command from "../../util/classes/Command";
import ToastClient from "../../util/classes/ToastClient";
import { CommandInteraction, GuildMember } from "discord.js";
import embed from "../../util/functions/embed";
import { APIInteractionDataResolvedGuildMember } from "discord-api-types";
import ms = require("ms");

export default class extends Command {
    public constructor(client: ToastClient) {
        super(client, {
            name: "balance",
            description: "View your or the specified member's balance.",
            category: "social",
            options: [
                {
                    "type": 6,
                    "name": "member",
                    "description": "Member",
                    "required": false
                },
            ]
        });
    }

    public async run(client: ToastClient, interaction: CommandInteraction) {
        let member: GuildMember | APIInteractionDataResolvedGuildMember = interaction.options.getMember("member");
        member = <GuildMember>member || <GuildMember>interaction.member;

        const { economy = {} } = interaction.guild.data;

        const symbol = economy.symbol || "$";
        const workTimeout = economy.workCooldown || 3_600_000;
        const crimeTimeout = economy.crimeCooldown || 3_600_000;
        const robTimeout = economy.robCooldown || 14_400_000;
        const dailyTimeout = 86_340_000;

        if (member) member.data = await client.db.members.get(interaction.guildId, member.user.id) || {};
        const {
            user,
            data: { bank = 0, lastWork = 0, lastDaily = 0, lastCrime = 0, lastRob = 0, worth = 0, inventory = [] }
        } = member;

        const diffRob = lastRob + robTimeout - Date.now();
        const diffWork = lastWork + workTimeout - Date.now();
        const diffDaily = lastDaily + dailyTimeout - Date.now();
        const diffCrime = lastCrime + crimeTimeout - Date.now();
        const robTime = diffRob > 0 ? ms(diffRob, { long: true }) : "**now**";
        const workTime = diffWork > 0 ? ms(diffWork, { long: true }) : "**now**";
        const crimeTime = diffCrime > 0 ? ms(diffCrime, { long: true }) : "**now**";
        const dailyTime = diffDaily > 0 ? ms(diffDaily, { long: true }) : "**now**";

        const start = interaction.member.user.id === member?.id
            ? "Your current balance is: "
            : `**${user.username}'s** current balance is: `;

        const items = [];
        let field = "";

        await interaction.defer();

        for (const itm of inventory) {
            const i = await client.db.guildShop.findOne({ _id: itm });
            if (i) items.push(i);
        }

        for (const item of items) {
            const itm = items[item];
            if (!itm) continue;
            field += `**${itm.name}** - ${symbol}${itm.cost}\n`;
        }

        const reply = await embed({
            title: "Balance",
            color: "GREEN",
            author: [interaction.user.tag, interaction.user.displayAvatarURL()],
            description: `${start} **${symbol}${worth}** (**${symbol}${bank}** in the bank).` +
                `\n• Time until work: ${workTime}` +
                `\n• Time until crime: ${crimeTime}` +
                `\n• Time until rob: ${robTime}` +
                `\n• Time until daily: ${dailyTime}`,
            fields: [
                ["Items", field || "No items"]
            ]
        });

        return interaction.followUp({ embeds: [reply] });
    }
}