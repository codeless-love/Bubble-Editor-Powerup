/* This is an example of how you would load a script that MUST execute in the "Extension UI world" (the options popup)
/* Please avoid doing this if at all possible. It is best to run the scripts in the content scripts (feature scripts) which have an isolated context. It's still possible to interact with the page through the isolated content scripts. */

console.log("❤️ This executes in the context of the popup (a.k.a. 'extension ui world')");