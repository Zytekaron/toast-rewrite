import SlashCommand from "../../util/classes/SlashCommand";
import ToastClient from "../../util/classes/ToastClient";
import { CommandInteraction, GuildMember, Snowflake } from "discord.js";

export default class extends SlashCommand {
    public constructor(client: ToastClient) {
        super(client, {
            name: "pay",
            description: "Pay another member.",
            category: "social",
            options: [
                {
                    "type": 6,
                    "name": "user",
                    "description": "User to pay",
                    "default": false,
                    "required": true
                },
                {
                    "type": 4,
                    "name": "amount",
                    "description": "Amount to pay",
                    "default": false,
                    "required": true
                }
            ]
        });
    }

    public async run(client: ToastClient, interaction: CommandInteraction) {
        let [user, amount] = interaction.options.map(v => v.value);

        const resolvedMember = await interaction.guild.members.fetch(<Snowflake>user)
            .catch(e => {
                return interaction.reply("<:no:811763209237037058> An error occurred while trying to fetch the user. Please report this to the Toast development team.", { ephemeral: true });
            });

        if (!resolvedMember) return interaction.reply("<:no:811763209237037058> An error occurred while trying to fetch the user. Please report this to the Toast development team.", { ephemeral: true });
        if (resolvedMember.user.bot) return interaction.reply("<:no:811763209237037058> You cannot pay a bot.", { ephemeral: true });

        const { economy = {} } = interaction.guild.data;
        const symbol = economy.symbol || "$";

        const { data: { balance = 0 } } = <GuildMember>interaction.member;

        if (amount < 1) return interaction.reply(`You cannot pay an amount less than ${symbol}1!`, { ephemeral: true });
        if (amount > balance) return interaction.reply("You cannot pay more money than you have in your balance!", { ephemeral: true });

        if (resolvedMember.id === interaction.user.id) return interaction.reply("Congrats, you paid yourself! *FYI nothing happened*.");

        await client.db.members.modWorth(interaction.guild.id, interaction.user.id, -amount);
        await client.db.members.modWorth(interaction.guild.id, resolvedMember.id, amount);
        await client.db.members.modBalance(interaction.guild.id, interaction.user.id, -amount);
        await client.db.members.modBalance(interaction.guild.id, resolvedMember.id, amount);

        return interaction.reply(`**${symbol}${amount}** has successfully been transferred to ${resolvedMember}.`);
    }
}