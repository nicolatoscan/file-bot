import * as dotenv from 'dotenv';
import { Telegraf, Context } from 'telegraf';
import { exec, spawn } from 'child_process';
import * as fs from 'fs';
import { InputFileByPath } from 'telegraf/typings/telegram-types';
dotenv.config();

class Bot {
    private bot: Telegraf<Context>;


    private urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*');

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

            let msgs = ctx.message.text.split(' ');
            let url: string = null;
            let filename: string = null;
            if (msgs.length > 0)
                url = msgs[0];
            if (msgs.length > 1)
                filename = msgs[1];


            if (url && this.urlPattern.test(url)) {
                this.downloadExec(url, filename, ctx)
            }
        }
    }

    private async downloadExec(url: string, filename: string, ctx: Context) {
        ctx.reply("Inizio download")

        let child = spawn('wget', [filename ? '-O' : '-P', filename ? `${process.env.PATH_TO_UPLOAD}/${filename}` : process.env.PATH_TO_UPLOAD, url]);
        child.stdout.on('data', (data) => { });
        child.stderr.on('data', (data) => { });
        child.on('close', async (code) => {
            
            ctx.reply("Download finito")
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (filename) {
                this.sendToTelegram(filename, ctx);
            } else {
                exec(`ls ${process.env.PATH_TO_UPLOAD} -Art | tail -n 1`, async (err, stdout, stderr) => {
                    filename = stdout.trim();
                    this.sendToTelegram(filename, ctx);
                });
            }

        });
    }
    
    private async sendToTelegram(filename: string, ctx: Context) {
        ctx.reply("Caricamento su Telegram")

            let file = await fs.readFileSync(`${process.env.PATH_TO_UPLOAD}/${filename}`)
            ctx.replyWithDocument({
                source: file,
                filename: filename
            });
    }

}

const bot = new Bot();