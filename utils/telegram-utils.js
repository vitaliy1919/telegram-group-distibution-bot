let sendMessage = (id, ctx, text, extra) => {
    ctx.telegram.sendMessage(id, text, extra).then()
    .catch(e => {
        console.log(e);
        ctx.reply(text, extra);
    })
}

module.exports = {
    sendMessage
}