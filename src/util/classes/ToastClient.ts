import { Client, Collection } from "discord.js";
import config from "../../config";
import { readdirSync } from "fs";
import { join } from "@fireflysemantics/join";
import { resolve } from "path";
import Event from "./Event";
import Command from "./Command";

const commandsDirectory = resolve(__dirname, "..", "..", "commands");
const eventsDirectory = resolve(__dirname, "..", "..", "events");

export default class ToastClient extends Client {
    commands: Collection<any, any>;
    config: any;

    constructor(options?: any) {
        super(options || {});

        this.commands = new Collection();
        this.config = config;
    }


    async connect() {
        await super.login(process.env.CLIENT_TOKEN);
        await this._loadEvents();
        await this._loadCommands();
        return this;
    }

    private async _loadCommands() {
        let count = 0;

        for (const filename of readdirSync(commandsDirectory, "utf8")) {
            if (filename.endsWith(".js") || filename.endsWith(".ts")) {
                const commandClass = require(join(commandsDirectory, filename))["default"];
                const command: Command = new commandClass(this);

                const split = join(commandsDirectory, filename).split(/[\/\\]/g);
                command.setCategory(split[split.length - 2]);

                if (this.commands.has(command.help.name)) {
                    throw new Error("Duplicate command name " + command.help.name);
                }

                count ++;
                this.commands.set(command.help.name, command);
            }
        }

        console.log(`[COMMANDS]: ${count} command(s) loaded`)
        return this;
    }

    private async _loadEvents() {
        for (const filename of readdirSync(eventsDirectory, "utf8")) {
            if (filename.endsWith(".js") || filename.endsWith(".ts")) {
                const eventClass = require(join(eventsDirectory, filename))["default"];
                const event: Event = new eventClass(this);

                console.log(`[EVENTS]: "${event.conf.name}" loaded`)
                if (event.conf.once) {
                    this.once(event.conf.name, (...args) => event.run(...args));
                } else {
                    this.on(event.conf.name, (...args) => event.run(...args));
                }
            }
        }

        return this;
    }
}