const axios = require('axios');
import { Octokit } from "octokit";
import ArrayListLanguage from "./Programming_Languages_Extensions";
const octokit = new Octokit({
    auth: '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'
})
async function listLanguage(user: string, repo: string) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/languages', {
        owner: user,
        repo: repo
    });
    console.log('language of ' + repo);
    console.log(res.data)
}
async function getListRepo(user: string) {
    console.log('list of langage of ' + user);
    const res = await axios.get('https://api.github.com/users/' + user + '/repos');
    res.data.forEach(element => {
        listLanguage(user, element.name)
    });
}
async function getListOrgs(user: string) {
    console.log('list of orgs of ' + user);
    const res = await axios.get('https://api.github.com/users/' + user + '/orgs');
    res.data.forEach(element => {
        console.log(element.login);
    });
}
async function getListRepoOfOrg(org: string) {
    console.log('list of Repo of ' + org);
    const res = await axios.get('https://api.github.com/orgs/' + org + '/repos');
    return res.data;
}
async function mixMap(listMap: Array<Promise<Map<string, { additions: number, deletions: number }>>>) {
    console.log('mix all ' + listMap.length + ' data');
    // it's a final map
    const Global = new Map<string, { additions: number, deletions: number }>();
    // await Promise.all -> for create a async forEach
    const test = listMap.map(async Element => {
        // calback of map
        return new Promise(async (resolve, reject) => {
            // Element is a promise<map> create forEach of map 
            (await Element).forEach((values, keys) => {
                // if this language dosent exist in global
                if (typeof Global.get(keys) == 'undefined') {
                    Global.set(keys, { additions: values.additions, deletions: values.deletions });
                } else {
                    //add value at global
                    const add: number = Global.get(keys).additions + values.additions;
                    const del: number = Global.get(keys).deletions + values.deletions;
                    Global.set(keys, { additions: add, deletions: del })
                }
            });
            resolve(true);
        })
    });
    await Promise.all(test);
    console.log({ Global });

}
async function getComit(owner: string, repo: string, hash: string) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: owner,
        repo: repo,
        ref: hash
    })
    const nameFile = new Map<string, { additions: number, deletions: number }>();
    res.data.files.forEach(element => {
        if (element.filename.includes('.')) {
            let extention: string = '.' + element.filename.split('.')[element.filename.split('.').length - 1];
            ArrayListLanguage.forEach((el) => {
                if (typeof el.extensions != 'undefined' && el.extensions.includes(extention)) {
                    if (typeof nameFile.get(el.name) == 'undefined') {
                        nameFile.set(el.name, { additions: element.additions, deletions: element.deletions });
                    } else {
                        const add: number = nameFile.get(el.name).additions + element.additions;
                        const del: number = nameFile.get(el.name).deletions + element.deletions;
                        nameFile.set(el.name, { additions: add, deletions: del })
                    }
                }
            });
        }
    })
    return (nameFile);
}
async function listComit(owner: string, repo: string, author?: string) {
    console.log('list comit of ' + owner + '/' + repo + ' comit by ' + author);
    let listRepo = [];
    let loop: boolean = true;
    let loopIndex: number = 1;
    while (loop) {
        const res = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: owner,
            repo: repo,
            author: author,
            per_page: 100,
            page: loopIndex
        });
        listRepo = listRepo.concat(res.data);
        if (res.data.length < 30) {
            loop = false;
        }
        loopIndex++;
    }
    const array = listRepo.map(element => {
        return getComit(owner, repo, element.sha);
    });
    mixMap(array);
}
// listComit('Menu-Vaucanson', 'Mobile', 'Wiwok');
listComit('UnelDev', 'MasterMind');
// getListRepoOfOrg('Menu-Vaucanson');
