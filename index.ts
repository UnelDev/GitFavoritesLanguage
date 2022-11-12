import listAllComitOfUser, { getRate } from "./gitHubApi";

async function createProgress(username) {
    let progress: string = '';
    const language = await listAllComitOfUser(username, undefined, ['0d14e31e796610802d493632c0b69cb5cfea30cf', '88cbbd4b8dcee8178f4b2ae17ebb753d4895df02']);
    language.forEach((values, keys) => {
        progress += `<progress id = "progress+${keys}" value = "${values.additions}" max = "${language.get('total').additions}"> ${(values.additions / language.get('total').additions) * 100} </progress>
        `
    });
    console.log(progress);
}
console.log('start');
createProgress('unelDev');