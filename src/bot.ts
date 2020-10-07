import * as dotenv from 'dotenv';
import { Telegraf, Context } from 'telegraf';
import { exec, spawn } from 'child_process';
import * as fs from 'fs';
import { InputFileByPath } from 'telegraf/typings/telegram-types';
dotenv.config();

class Bot {
    private bot: Telegraf<Context>;

    constructor() {
        this.bot = new Telegraf(process.env.BOT_TOKEN)
        this.middleware()
        this.bot.launch()
        console.log("Bot started!")
    }

    private middleware(): void {
        this.bot.on("message", ctx => this.onMessage(ctx))
    }

    private async onMessage(ctx: Context) {
        if (ctx.chat.username === "nicolatoscan") {
            const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*');
            let msg = ctx.message.text;
            if (urlPattern.test(msg)) {
                this.downloadExec(msg, ctx)
            }
        }
    }

    private async downloadExec(url: string, ctx: Context) {
        ctx.reply("Inizio download")

        let child = spawn('wget', ['-P', process.env.PATH_TO_UPLOAD, url]);
        child.stdout.on('data', (data) => { });
        child.stderr.on('data', (data) => { });
        child.on('close', (code) => {
            ctx.reply("Download finito")
            ctx.reply("Caricamento su Telegram")
            exec(`ls ${process.env.PATH_TO_TEMP} -Art | tail -n 1`, (err, stdout, stderr) => {
                ctx.replyWithDocument({
                    url: url,
                    filename: stdout ? stdout : "unnamed"
                });
            });
        });
    }
    
}

const bot = new Bot();